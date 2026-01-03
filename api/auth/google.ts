import { OAuth2Client } from 'google-auth-library';
import { readBody, getEnv, upsertUserFromIdentity, signSession, setSessionCookie } from '../_utils';

export default async function handler(req: any, res: any) {
  try {
    const clientId = getEnv('GOOGLE_CLIENT_ID');
    const clientSecret = getEnv('GOOGLE_CLIENT_SECRET');
    
    // Determine Base URL: Prefer env var, fallback to request headers (for local dev)
    let baseUrl = getEnv('BASE_URL');
    if (!baseUrl) {
      const host = req.headers.host;
      const proto = req.headers['x-forwarded-proto'] || 'http';
      baseUrl = `${proto}://${host}`;
    }
    // Remove trailing slash if present
    baseUrl = baseUrl.replace(/\/$/, '');

    const redirectUri = `${baseUrl}/api/auth/google`;

    if (!clientId || !clientSecret) {
      console.error('Google Auth: Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET');
      res.statusCode = 500;
      res.end(JSON.stringify({ ok: false, error: 'server_configuration_error' }));
      return;
    }

    const client = new OAuth2Client(clientId, clientSecret, redirectUri);

    if (req.method === 'GET') {
      const url = new URL((req as any).url || '', baseUrl);
      const code = url.searchParams.get('code');
      const state = url.searchParams.get('state') || '';
      const error = url.searchParams.get('error');

      if (error) {
        console.error('Google Auth Error from Callback:', error);
        res.statusCode = 400;
        res.end(JSON.stringify({ ok: false, error: 'google_auth_error', details: error }));
        return;
      }

      // 1. Redirect to Google Login
      if (!code) {
        const authorizeUrl = client.generateAuthUrl({
          access_type: 'online', // We only need login, not refresh tokens for offline access usually
          scope: ['openid', 'email', 'profile'],
          prompt: 'select_account', // Force account selection
          state: state,
          redirect_uri: redirectUri 
        });
        
        res.statusCode = 302;
        res.setHeader('Location', authorizeUrl);
        res.end();
        return;
      }

      // 2. Handle Callback (Exchange Code for Token)
      try {
        const { tokens } = await client.getToken(code);
        client.setCredentials(tokens);

        // Verify ID Token
        const ticket = await client.verifyIdToken({
            idToken: tokens.id_token!,
            audience: clientId,
        });
        const payload = ticket.getPayload();

        if (!payload) {
             throw new Error('Empty payload from Google ID Token');
        }

        const { sub, email, name, picture } = payload;

        // Persist user (Attempt to save to file/db, but don't fail session if this fails on Vercel)
        const identity = { 
            provider: 'google', 
            providerId: sub, 
            email, 
            name, 
            picture 
        };
        
        let userId = sub;
        try {
            const user = await upsertUserFromIdentity(identity);
            userId = user.userId;
        } catch (err) {
            console.warn('Failed to persist user to disk (expected on Vercel):', err);
            // Fallback: Use Google ID as user ID for stateless session
        }

        // Create JWT Session (Stateless: Include profile data directly)
        const sessionPayload = {
            userId: userId,
            email: email,
            name: name,
            picture: picture,
            provider: 'google'
        };

        const jwt = await signSession(sessionPayload);
        setSessionCookie(res, jwt);

        // Redirect back to app
        const returnTo = state && /^\/[a-zA-Z0-9_\-\/?=&.]*$/.test(state) ? state : '/';
        res.statusCode = 302;
        res.setHeader('Location', `${baseUrl}${returnTo}`);
        res.end();
        return;

      } catch (err: any) {
        console.error('Google Auth Code Exchange Error:', err);
        res.statusCode = 401;
        res.end(JSON.stringify({ ok: false, error: 'authentication_failed', details: err.message }));
        return;
      }
    }

    if (req.method === 'POST') {
        // Handle ID Token sent from frontend (e.g. Mobile or One Tap)
        const { idToken } = await readBody(req);
        if (!idToken) return res.status(400).json({ ok: false, error: 'missing_id_token' });

        try {
            const ticket = await client.verifyIdToken({
                idToken: idToken,
                audience: clientId,
            });
            const payload = ticket.getPayload();
            if (!payload) throw new Error('Invalid Token');

            const { sub, email, name, picture } = payload;
            
             const identity = { 
                provider: 'google', 
                providerId: sub, 
                email, 
                name, 
                picture 
            };
            
            let userId = sub;
            let merchantProfile: any = undefined;
            try {
                const user = await upsertUserFromIdentity(identity);
                userId = user.userId;
                merchantProfile = user.merchantProfile;
            } catch (e) {
                // Ignore persistence error
            }

            const role = merchantProfile ? 'merchant' : 'user';

            const sessionPayload = {
                userId: userId,
                email: email,
                name: name,
                picture: picture,
                provider: 'google',
                role,
                merchantProfile
            };

            const jwt = await signSession(sessionPayload);
            setSessionCookie(res, jwt);
            return res.json({ ok: true, user: sessionPayload, token: jwt, userId, role });

        } catch (err: any) {
            console.error('ID Token Verification Failed:', err);
             return res.status(401).json({ ok: false, error: 'invalid_token' });
        }
    }

    res.statusCode = 405;
    res.end(JSON.stringify({ ok: false, error: 'method_not_allowed' }));
  } catch (e: any) {
    console.error('Google Auth Handler Fatal Error:', e);
    res.statusCode = 500;
    res.end(JSON.stringify({ ok: false, error: 'server_error', message: e?.message }));
  }
}

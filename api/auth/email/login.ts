import { readBody, getUserByEmail, signSession, setSessionCookie, comparePassword } from '../../_utils';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'method_not_allowed' });
  try {
    const { email, password } = await readBody(req);
    if (!email || !password) return res.status(400).json({ ok: false, error: 'missing_credentials' });
    
    // Find user by email (regardless of provider, but must have passwordHash for email login)
    const user = await getUserByEmail(email);
    
    if (!user || !user.passwordHash) {
        // If user exists but has no password (e.g. Google only), they must sign in with Google first
        // Or we could generic "invalid login" to avoid enumeration.
        return res.status(401).json({ ok: false, error: 'invalid_login' });
    }

    const isValid = comparePassword(password, user.passwordHash);
    if (!isValid) return res.status(401).json({ ok: false, error: 'invalid_login' });

    // Create Stateless Session with Profile Data
    const merchantProfile = user.merchantProfile;
    const role = merchantProfile ? 'merchant' : 'user';

    const sessionPayload = {
        userId: user.userId,
        email: user.email,
        name: user.name,
        picture: user.picture,
        provider: 'email',
        role,
        merchantProfile
    };

    const jwt = await signSession(sessionPayload);
    setSessionCookie(res, jwt);
    return res.json({ ok: true, user: sessionPayload, token: jwt, userId: user.userId, role });
  } catch (e: any) {
    console.error('Login Error:', e);
    return res.status(500).json({ ok: false, error: e?.message || 'server_error' });
  }
}

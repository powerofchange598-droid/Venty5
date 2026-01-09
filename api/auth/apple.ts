import * as jose from 'jose';
import { readBody, getEnv, upsertUserFromIdentity, signSession, setSessionCookie } from '../_utils';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'method_not_allowed' });
  try {
    const { idToken } = await readBody(req);
    if (!idToken) return res.status(400).json({ ok: false, error: 'missing_id_token' });
    const JWKS = jose.createRemoteJWKSet(new URL('https://appleid.apple.com/auth/keys'));
    const audience = getEnv('APPLE_CLIENT_ID') || undefined;
    const { payload } = await jose.jwtVerify(idToken, JWKS, { issuer: 'https://appleid.apple.com', audience });
    const identity = { provider: 'apple', providerId: String(payload.sub), email: (payload as any).email, name: '' };
    const upserted = await upsertUserFromIdentity(identity);
    const role = upserted.merchantProfile ? 'merchant' : 'user';
    const sessionPayload = {
        userId: upserted.userId,
        email: upserted.email,
        name: upserted.name,
        picture: upserted.picture,
        provider: 'apple',
        role,
        merchantProfile: upserted.merchantProfile
    };
    const jwt = await signSession(sessionPayload);
    setSessionCookie(res, jwt);
    return res.json({ ok: true, user: sessionPayload, token: jwt });
  } catch (e: any) {
    return res.status(401).json({ ok: false, error: e?.message || 'invalid_token' });
  }
}

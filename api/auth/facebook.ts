import { readBody, upsertUserFromIdentity, getEnv, signSession, setSessionCookie } from '../_utils';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'method_not_allowed' });
  try {
    const { accessToken } = await readBody(req);
    if (!accessToken) return res.status(400).json({ ok: false, error: 'missing_access_token' });
    const appId = getEnv('FACEBOOK_APP_ID');
    const appSecret = getEnv('FACEBOOK_APP_SECRET');
    if (!appId || !appSecret) return res.status(500).json({ ok: false, error: 'facebook_env_missing' });
    const dbg = await fetch(`https://graph.facebook.com/debug_token?input_token=${encodeURIComponent(accessToken)}&access_token=${encodeURIComponent(appId)}|${encodeURIComponent(appSecret)}`);
    const dbgData = await dbg.json();
    if (!dbg.ok || !dbgData?.data?.is_valid) return res.status(401).json({ ok: false, error: 'invalid_token' });
    const me = await fetch(`https://graph.facebook.com/me?fields=id,name,email,picture&access_token=${encodeURIComponent(accessToken)}`);
    const profile = await me.json();
    if (!me.ok) return res.status(401).json({ ok: false, error: 'invalid_token' });
    const identity = { provider: 'facebook', providerId: String(profile.id), email: profile.email, name: profile.name, picture: profile.picture?.data?.url };
    const user = await upsertUserFromIdentity(identity);
    const sessionPayload = {
        userId: user.userId,
        email: user.email,
        name: user.name,
        picture: user.picture,
        role: user.role || 'user',
        provider: 'facebook'
    };
    const jwt = await signSession(sessionPayload);
    setSessionCookie(res, jwt);
    return res.json({ ok: true, user: sessionPayload, token: jwt });
  } catch (e: any) {
    return res.status(500).json({ ok: false, error: e?.message || 'server_error' });
  }
}

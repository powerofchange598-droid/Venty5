import { verifySession, getUserByEmail } from '../_utils';

export default async function handler(req: any, res: any) {
  try {
    let token = '';
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else {
      const cookie = String(req.headers.cookie || '');
      token = cookie.split(';').map(x => x.trim()).find(x => x.startsWith('venty_session='))?.split('=')[1] || '';
    }

    if (!token) return res.json({ ok: false });
    
    const payload = await verifySession(token).catch(() => null);
    if (!payload?.userId) return res.json({ ok: false });

    // 1. Try to load from DB
    let user = null;
    if (payload.email) {
        user = await getUserByEmail(payload.email as string);
    }

    // 2. Fallback to JWT payload (Stateless Auth for Vercel or if DB fails)
    if (!user) {
        user = {
            userId: payload.userId,
            email: payload.email,
            name: payload.name,
            picture: payload.picture,
            role: payload.role || 'user',
            providers: [{ provider: payload.provider || 'google', providerUserId: payload.userId }],
            createdAt: new Date().toISOString()
        };
    }

    // Ensure role is present
    if (!user.role) user.role = payload.role || 'user';

    return res.json({ ok: true, user, token });
  } catch {
    return res.json({ ok: false });
  }
}

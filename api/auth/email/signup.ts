import { readBody, upsertUserFromIdentity, signSession, setSessionCookie, getUserByEmail, updateUserPassword, hashPassword } from '../../_utils';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'method_not_allowed' });
  try {
    const { email, password, name } = await readBody(req);
    if (!email || !password) return res.status(400).json({ ok: false, error: 'missing_credentials' });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ ok: false, error: 'invalid_email' });
    if (password.length < 8) return res.status(400).json({ ok: false, error: 'weak_password' });

    const existing = await getUserByEmail(email);
    
    // If user exists and has a password, reject
    if (existing && existing.passwordHash) return res.status(409).json({ ok: false, error: 'email_exists' });

    // If user exists (e.g. from Google) but has no password, we could "upgrade" them.
    // For now, let's treat it as "email exists" to avoid confusion, or handle merging.
    // The prompt says: "If Google user email already exists, log them in instead of creating a duplicate"
    // But this is SIGNUP. If they are signing up with email, and they already have Google, 
    // strictly speaking we should tell them to login with Google or allow them to set a password.
    // Let's allow setting a password if they don't have one (merging).
    
    const hashedPassword = hashPassword(password);
    
    // Identity for upsert (will find existing by email)
    const identity = { provider: 'email', providerId: email, email, name: name || email.split('@')[0] };
    const user = await upsertUserFromIdentity(identity);
    
    // Update password
    await updateUserPassword(user.userId, hashedPassword);
    
    // Create Stateless Session with Profile Data
    const sessionPayload = {
        userId: user.userId,
        email: user.email,
        name: user.name,
        picture: user.picture,
        provider: 'email'
    };

    const jwt = await signSession(sessionPayload);
    setSessionCookie(res, jwt);
    return res.json({ ok: true, user: sessionPayload });
  } catch (e: any) {
    console.error('Signup Error:', e);
    return res.status(500).json({ ok: false, error: e?.message || 'server_error' });
  }
}

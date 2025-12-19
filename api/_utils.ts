import * as jose from 'jose';
import bcrypt from 'bcryptjs';
import { getDb } from '../lib/db';

type Identity = { provider: string; providerId: string; email?: string; name?: string; picture?: string };
type User = { userId: string; email?: string; name?: string; picture?: string; providers: { provider: string; providerUserId: string }[]; passwordHash?: string; createdAt: string };

const readBody = async (req: any) => {
  if (req.body) return req.body;
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(Buffer.from(chunk));
  const raw = Buffer.concat(chunks).toString('utf8');
  try { return JSON.parse(raw || '{}'); } catch { return {}; }
};

const getEnv = (k: string) => process.env[k] || '';

const getUserByEmail = async (email: string): Promise<User | null> => {
    const db = await getDb();
    const user = await db.get('SELECT * FROM users WHERE email = ?', email);
    if (!user) return null;
    
    const providers = await db.all('SELECT * FROM providers WHERE user_id = ?', user.id);
    
    return {
        userId: user.id,
        email: user.email,
        name: user.name,
        picture: user.picture,
        passwordHash: user.password_hash,
        createdAt: user.created_at,
        providers: providers.map(p => ({ provider: p.provider, providerUserId: p.provider_user_id }))
    };
};

const upsertUserFromIdentity = async (identity: Identity): Promise<User> => {
    const db = await getDb();
    
    // Check by email or provider
    let user = await db.get(
        `SELECT u.* FROM users u 
         LEFT JOIN providers p ON u.id = p.user_id 
         WHERE u.email = ? OR (p.provider = ? AND p.provider_user_id = ?)`,
        [identity.email, identity.provider, identity.providerId]
    );

    if (!user) {
        // Create new user
        const id = `u_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
        await db.run(
            'INSERT INTO users (id, email, name, picture, created_at) VALUES (?, ?, ?, ?, ?)',
            [id, identity.email, identity.name, identity.picture, new Date().toISOString()]
        );
        user = { id, email: identity.email, name: identity.name, picture: identity.picture };
    } else {
        // Update user details if new info provided
        if (identity.email && !user.email) await db.run('UPDATE users SET email = ? WHERE id = ?', identity.email, user.id);
        if (identity.name && !user.name) await db.run('UPDATE users SET name = ? WHERE id = ?', identity.name, user.id);
        if (identity.picture && !user.picture) await db.run('UPDATE users SET picture = ? WHERE id = ?', identity.picture, user.id);
        
        // Refresh user object
        user = await db.get('SELECT * FROM users WHERE id = ?', user.id);
    }

    // Upsert provider link
    await db.run(
        'INSERT OR IGNORE INTO providers (provider, provider_user_id, user_id) VALUES (?, ?, ?)',
        [identity.provider, identity.providerId, user.id]
    );

    const providers = await db.all('SELECT * FROM providers WHERE user_id = ?', user.id);

    return {
        userId: user.id,
        email: user.email,
        name: user.name,
        picture: user.picture,
        passwordHash: user.password_hash,
        createdAt: user.created_at,
        providers: providers.map(p => ({ provider: p.provider, providerUserId: p.provider_user_id }))
    };
};

const updateUserPassword = async (userId: string, passwordHash: string) => {
    const db = await getDb();
    await db.run('UPDATE users SET password_hash = ? WHERE id = ?', passwordHash, userId);
};

const hashPassword = (password: string) => {
    const salt = bcrypt.genSaltSync(10);
    return bcrypt.hashSync(password, salt);
};

const comparePassword = (password: string, hash: string) => {
    return bcrypt.compareSync(password, hash);
};

const signSession = async (payload: Record<string, any>) => {
  const secret = getEnv('JWT_SECRET');
  if (!secret) throw new Error('jwt_secret_missing');
  const key = new TextEncoder().encode(secret);
  // Store user data in JWT for stateless auth on Vercel
  const token = await new jose.SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(key);
  return token;
};

const verifySession = async (token: string) => {
  const secret = getEnv('JWT_SECRET');
  if (!secret) throw new Error('jwt_secret_missing');
  const key = new TextEncoder().encode(secret);
  const { payload } = await jose.jwtVerify(token, key);
  return payload;
};

const isSecure = (req: any) => {
  const proto = (req.headers['x-forwarded-proto'] || '').toString();
  return proto === 'https' || !!process.env.VERCEL || !!process.env.VERCEL_ENV;
};

const setSessionCookie = (res: any, token: string) => {
  const parts = ['venty_session=' + token, 'Path=/', 'HttpOnly', 'SameSite=Lax', 'Max-Age=' + (7 * 24 * 60 * 60)];
  if (isSecure((res as any).req || {})) parts.push('Secure');
  res.setHeader('Set-Cookie', parts.join('; '));
};

const clearSessionCookie = (res: any) => {
  const parts = ['venty_session=', 'Path=/', 'HttpOnly', 'SameSite=Lax', 'Max-Age=0'];
  if (isSecure((res as any).req || {})) parts.push('Secure');
  res.setHeader('Set-Cookie', parts.join('; '));
};

export { readBody, getEnv, getUserByEmail, upsertUserFromIdentity, updateUserPassword, signSession, verifySession, setSessionCookie, clearSessionCookie, hashPassword, comparePassword };

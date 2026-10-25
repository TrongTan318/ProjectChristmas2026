import 'server-only';
import { SignJWT, jwtVerify, type JWTPayload } from 'jose';
import { env } from './env';

function key() {
  return new TextEncoder().encode(env().SESSION_SECRET);
}

export async function signJwt(payload: JWTPayload, audience: string, ttlSeconds: number) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setAudience(audience)
    .setExpirationTime(Math.floor(Date.now() / 1000) + ttlSeconds)
    .sign(key());
}

export async function verifyJwt<T extends JWTPayload>(token: string, audience: string): Promise<T | null> {
  try {
    const { payload } = await jwtVerify(token, key(), { audience, algorithms: ['HS256'] });
    return payload as T;
  } catch {
    return null;
  }
}

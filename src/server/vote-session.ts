import 'server-only';
import { cookies } from 'next/headers';
import type { JWTPayload } from 'jose';
import { env } from './env';
import { signJwt, verifyJwt } from './jwt';

export const VOTE_COOKIE = 'vote_session';
const TTL = 30 * 60;
const AUDIENCE = 'vote';

export interface VoteSession {
  tid: string; // token id
  cid: string; // contest id
  serial: number;
}

export async function createVoteSessionCookie(session: VoteSession) {
  const value = await signJwt({ ...session }, AUDIENCE, TTL);
  return {
    name: VOTE_COOKIE,
    value,
    options: {
      httpOnly: true,
      secure: env().COOKIE_SECURE,
      sameSite: 'lax' as const,
      path: '/',
      maxAge: TTL,
    },
  };
}

export async function setVoteSession(session: VoteSession) {
  const c = await createVoteSessionCookie(session);
  (await cookies()).set(c.name, c.value, c.options);
}

export async function getVoteSession(): Promise<VoteSession | null> {
  const raw = (await cookies()).get(VOTE_COOKIE)?.value;
  if (!raw) return null;
  return verifyJwt<VoteSession & JWTPayload>(raw, AUDIENCE);
}

export async function clearVoteSession() {
  (await cookies()).delete(VOTE_COOKIE);
}

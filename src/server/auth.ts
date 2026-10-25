import 'server-only';
import { cache } from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { hash, verify } from '@node-rs/argon2';
import type { RoleCode } from '@prisma/client';
import { prisma } from './db';
import { env } from './env';
import { signJwt, verifyJwt } from './jwt';

export const ADMIN_COOKIE = 'admin_session';
const SESSION_TTL = 8 * 60 * 60;
const AUDIENCE = 'admin';

export class ForbiddenError extends Error {
  constructor(message = 'Bạn không có quyền thực hiện thao tác này.') {
    super(message);
    this.name = 'ForbiddenError';
  }
}

export function hashPassword(password: string) {
  return hash(password);
}

export async function verifyPassword(passwordHash: string, password: string) {
  try {
    return await verify(passwordHash, password);
  } catch {
    return false;
  }
}

export async function startAdminSession(user: { id: string; sessionVersion: number }) {
  const token = await signJwt({ uid: user.id, ver: user.sessionVersion }, AUDIENCE, SESSION_TTL);
  (await cookies()).set(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: env().COOKIE_SECURE,
    sameSite: 'strict',
    path: '/',
    maxAge: SESSION_TTL,
  });
}

export async function endAdminSession() {
  (await cookies()).delete(ADMIN_COOKIE);
}

export const getCurrentAdmin = cache(async () => {
  const raw = (await cookies()).get(ADMIN_COOKIE)?.value;
  if (!raw) return null;
  const payload = await verifyJwt<{ uid: string; ver: number }>(raw, AUDIENCE);
  if (!payload) return null;
  const user = await prisma.user.findFirst({
    where: { id: payload.uid, isActive: true, deletedAt: null },
    include: { role: true },
  });
  if (!user || user.sessionVersion !== payload.ver) return null;
  return user;
});

export type AdminUser = NonNullable<Awaited<ReturnType<typeof getCurrentAdmin>>>;

export async function requireAdmin(): Promise<AdminUser> {
  const user = await getCurrentAdmin();
  if (!user) redirect('/admin/login');
  return user;
}

export function isSuperAdmin(user: { role: { code: RoleCode } }) {
  return user.role.code === 'SUPER_ADMIN';
}

export async function requireSuperAdmin(): Promise<AdminUser> {
  const user = await requireAdmin();
  if (!isSuperAdmin(user)) throw new ForbiddenError('Chỉ Super Admin được thực hiện thao tác này.');
  return user;
}

/** Xác thực lại mật khẩu cho thao tác nhạy cảm. */
export async function requireSuperAdminWithPassword(password: unknown): Promise<AdminUser> {
  const user = await requireSuperAdmin();
  if (typeof password !== 'string' || !(await verifyPassword(user.passwordHash, password))) {
    throw new ForbiddenError('Mật khẩu xác nhận không đúng.');
  }
  return user;
}

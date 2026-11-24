import 'server-only';
import { cache } from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { hash, verify } from '@node-rs/argon2';
import type { RoleCode } from '@prisma/client';
import { canManageProduct, isStaffRole } from '@/domain/access';
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

/** Người đang đăng nhập — mọi vai trò, kể cả tài khoản lớp. Chỉ dùng ở nơi đã kiểm tra quyền theo lớp. */
export const getCurrentUser = cache(async () => {
  const raw = (await cookies()).get(ADMIN_COOKIE)?.value;
  if (!raw) return null;
  const payload = await verifyJwt<{ uid: string; ver: number }>(raw, AUDIENCE);
  if (!payload) return null;
  const user = await prisma.user.findFirst({
    where: { id: payload.uid, isActive: true, deletedAt: null },
    include: { role: true, team: { select: { id: true, name: true, className: true, deletedAt: true } } },
  });
  if (!user || user.sessionVersion !== payload.ver) return null;
  return user;
});

export type SessionUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;

/**
 * Quản trị viên (Super Admin / Admin). Tài khoản lớp → null, nên mọi trang/API đang dùng hàm này
 * tự động chặn tài khoản lớp (mặc định từ chối).
 */
export const getCurrentAdmin = cache(async () => {
  const user = await getCurrentUser();
  return user && isStaffRole(user.role.code) ? user : null;
});

export type AdminUser = SessionUser;

export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect('/admin/login');
  return user;
}

export async function requireAdmin(): Promise<AdminUser> {
  const user = await requireUser();
  // Tài khoản lớp vào trang quản trị khác → về trang ảnh của lớp mình.
  if (!isStaffRole(user.role.code)) redirect('/admin/stages');
  return user;
}

export function isTeamUser(user: { role: { code: RoleCode } }) {
  return user.role.code === 'TEAM';
}

/** Kiểm tra quyền sửa ảnh/giai đoạn của một sản phẩm: quản trị viên mọi sản phẩm, tài khoản lớp chỉ lớp mình. */
export async function requireProductAccess(productId: string) {
  const user = await getCurrentUser();
  if (!user) throw new ForbiddenError('Phiên đăng nhập đã hết hạn.');
  const product = await prisma.product.findFirst({ where: { id: productId, deletedAt: null } });
  if (!product) throw new ForbiddenError('Không tìm thấy sản phẩm.');
  const teamId = user.team && !user.team.deletedAt ? user.teamId : null;
  if (!canManageProduct({ roleCode: user.role.code, teamId }, product)) {
    throw new ForbiddenError('Bạn chỉ được chỉnh sửa trang của lớp mình.');
  }
  return { user, product };
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

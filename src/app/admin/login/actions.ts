'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { audit } from '@/server/audit';
import { parseLoginId } from '@/domain/access';
import { endAdminSession, getCurrentUser, hashPassword, startAdminSession, verifyPassword } from '@/server/auth';
import { prisma } from '@/server/db';
import { hit } from '@/server/rate-limit';
import { clientIp } from '@/server/request';

const MAX_FAILED = 5;
const LOCK_MINUTES = 15;
const GENERIC_ERROR = 'Tên đăng nhập hoặc mật khẩu không đúng.';
let dummyHash: Promise<string> | undefined;

const schema = z.object({
  login: z.string().max(120),
  password: z.string().min(1).max(200),
});

export async function login(_prev: { error: string } | null, form: FormData) {
  const ip = await clientIp();
  if (!hit(`login:${ip}`, 10, 15 * 60_000)) {
    return { error: 'Bạn đã thử quá nhiều lần. Vui lòng đợi 15 phút.' };
  }

  const parsed = schema.safeParse({ login: form.get('login'), password: form.get('password') });
  const loginId = parsed.success ? parseLoginId(parsed.data.login) : null;
  if (!parsed.success || !loginId) return { error: GENERIC_ERROR };
  const { password } = parsed.data;

  // Email (quản trị viên) hoặc tên đăng nhập (tài khoản lớp).
  const user = await prisma.user.findFirst({
    where: { ...(loginId.kind === 'email' ? { email: loginId.value } : { username: loginId.value }), deletedAt: null },
    include: { role: true },
  });
  if (!user || !user.isActive) {
    // Vẫn băm để thời gian phản hồi tương đương, tránh dò email.
    dummyHash ??= hashPassword('khong-phai-mat-khau-that');
    await verifyPassword(await dummyHash, password);
    return { error: GENERIC_ERROR };
  }

  if (user.lockedUntil && user.lockedUntil > new Date()) {
    return { error: `Tài khoản tạm khóa do đăng nhập sai nhiều lần. Thử lại sau ${LOCK_MINUTES} phút.` };
  }

  if (!(await verifyPassword(user.passwordHash, password))) {
    const failed = user.failedLogins + 1;
    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLogins: failed >= MAX_FAILED ? 0 : failed,
        lockedUntil: failed >= MAX_FAILED ? new Date(Date.now() + LOCK_MINUTES * 60_000) : null,
      },
    });
    if (failed >= MAX_FAILED) await audit({ userId: user.id, action: 'auth.locked', entityType: 'User', entityId: user.id });
    return { error: GENERIC_ERROR };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { failedLogins: 0, lockedUntil: null, lastLoginAt: new Date() },
  });
  await startAdminSession(user);
  await audit({ userId: user.id, action: 'auth.login', entityType: 'User', entityId: user.id });
  redirect(user.role.code === 'TEAM' ? '/admin/stages' : '/admin');
}

export async function logout() {
  const user = await getCurrentUser();
  if (user) await audit({ userId: user.id, action: 'auth.logout', entityType: 'User', entityId: user.id });
  await endAdminSession();
  redirect('/admin/login');
}

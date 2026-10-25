'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { audit } from '@/server/audit';
import { endAdminSession, getCurrentAdmin, hashPassword, startAdminSession, verifyPassword } from '@/server/auth';
import { prisma } from '@/server/db';
import { hit } from '@/server/rate-limit';
import { clientIp } from '@/server/request';

const MAX_FAILED = 5;
const LOCK_MINUTES = 15;
const GENERIC_ERROR = 'Email hoặc mật khẩu không đúng.';
let dummyHash: Promise<string> | undefined;

const schema = z.object({
  email: z.string().trim().toLowerCase().email().max(120),
  password: z.string().min(1).max(200),
});

export async function login(_prev: { error: string } | null, form: FormData) {
  const ip = await clientIp();
  if (!hit(`login:${ip}`, 10, 15 * 60_000)) {
    return { error: 'Bạn đã thử quá nhiều lần. Vui lòng đợi 15 phút.' };
  }

  const parsed = schema.safeParse({ email: form.get('email'), password: form.get('password') });
  if (!parsed.success) return { error: GENERIC_ERROR };
  const { email, password } = parsed.data;

  const user = await prisma.user.findFirst({ where: { email, deletedAt: null } });
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
  redirect('/admin');
}

export async function logout() {
  const user = await getCurrentAdmin();
  if (user) await audit({ userId: user.id, action: 'auth.logout', entityType: 'User', entityId: user.id });
  await endAdminSession();
  redirect('/admin/login');
}

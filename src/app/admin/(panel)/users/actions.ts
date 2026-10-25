'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import type { ActionState } from '@/lib/action';
import { bool, runAction, str, UserError } from '@/server/action';
import { audit } from '@/server/audit';
import { hashPassword, requireSuperAdmin, requireSuperAdminWithPassword } from '@/server/auth';
import { prisma } from '@/server/db';

const password = z.string().min(10, 'Mật khẩu tối thiểu 10 ký tự').max(200);
const roleCode = z.enum(['ADMIN', 'SUPER_ADMIN']);

export async function createUser(_prev: ActionState, form: FormData) {
  return runAction(async () => {
    const actor = await requireSuperAdminWithPassword(form.get('confirmPassword'));
    const data = z
      .object({ email: z.string().trim().toLowerCase().email('Email không hợp lệ'), name: z.string().trim().min(1, 'Nhập họ tên').max(120), password, role: roleCode })
      .parse({ email: str(form, 'email'), name: str(form, 'name'), password: String(form.get('password') ?? ''), role: str(form, 'role') });
    const role = await prisma.role.findUniqueOrThrow({ where: { code: data.role } });
    const user = await prisma.user.create({
      data: { email: data.email, name: data.name, passwordHash: await hashPassword(data.password), roleId: role.id },
    });
    await audit({ userId: actor.id, action: 'user.create', entityType: 'User', entityId: user.id, after: { email: user.email, role: data.role } });
    revalidatePath('/admin/users');
    return `Đã tạo tài khoản ${user.email}.`;
  });
}

export async function updateUser(_prev: ActionState, form: FormData) {
  return runAction(async () => {
    const actor = await requireSuperAdminWithPassword(form.get('confirmPassword'));
    const id = str(form, 'id');
    const target = await prisma.user.findFirst({ where: { id, deletedAt: null }, include: { role: true } });
    if (!target) throw new UserError('Không tìm thấy tài khoản.');
    const role = roleCode.parse(str(form, 'role'));
    const isActive = bool(form, 'isActive');
    if (target.id === actor.id && (role !== 'SUPER_ADMIN' || !isActive)) {
      throw new UserError('Không thể tự hạ quyền hoặc khóa chính mình.');
    }
    const newPassword = String(form.get('newPassword') ?? '');
    const roleRow = await prisma.role.findUniqueOrThrow({ where: { code: role } });
    const securityChanged = !!newPassword || role !== target.role.code || isActive !== target.isActive;
    const updated = await prisma.user.update({
      where: { id },
      data: {
        roleId: roleRow.id,
        isActive,
        name: z.string().trim().min(1).max(120).parse(str(form, 'name')),
        ...(newPassword ? { passwordHash: await hashPassword(password.parse(newPassword)), failedLogins: 0, lockedUntil: null } : {}),
        // Đổi quyền / khóa / đổi mật khẩu: đăng xuất mọi phiên cũ.
        ...(securityChanged ? { sessionVersion: { increment: 1 } } : {}),
      },
    });
    await audit({
      userId: actor.id,
      action: 'user.update',
      entityType: 'User',
      entityId: id,
      before: { role: target.role.code, isActive: target.isActive },
      after: { role, isActive: updated.isActive, passwordChanged: !!newPassword },
    });
    revalidatePath('/admin/users');
    return 'Đã cập nhật tài khoản.';
  });
}

export async function unlockUser(_prev: ActionState, form: FormData) {
  return runAction(async () => {
    const actor = await requireSuperAdmin();
    const id = str(form, 'id');
    await prisma.user.update({ where: { id }, data: { failedLogins: 0, lockedUntil: null } });
    await audit({ userId: actor.id, action: 'user.unlock', entityType: 'User', entityId: id });
    revalidatePath('/admin/users');
    return 'Đã mở khóa đăng nhập.';
  });
}

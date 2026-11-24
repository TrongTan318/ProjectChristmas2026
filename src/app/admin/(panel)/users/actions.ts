'use server';

import { randomInt } from 'node:crypto';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { isValidUsername, normalizeUsername, PASSWORD_ALPHABET, suggestUsername } from '@/domain/access';
import type { ActionState } from '@/lib/action';
import { bool, runAction, str, UserError } from '@/server/action';
import { audit } from '@/server/audit';
import { hashPassword, requireSuperAdmin, requireSuperAdminWithPassword } from '@/server/auth';
import { requireActiveContest } from '@/server/contest';
import { prisma } from '@/server/db';

const password = z.string().min(10, 'Mật khẩu tối thiểu 10 ký tự').max(200);
const roleCode = z.enum(['ADMIN', 'SUPER_ADMIN', 'TEAM']);
const username = z
  .string()
  .transform(normalizeUsername)
  .refine(isValidUsername, 'Tên đăng nhập 3–40 ký tự: chữ thường không dấu, số, dấu gạch ngang (vd. bao-dong-1).');

/** Tài khoản lớp phải gắn với một lớp (đội) còn hoạt động của cuộc thi đang chạy. */
async function resolveTeam(teamId: string) {
  if (!teamId) throw new UserError('Chọn lớp cho tài khoản lớp.');
  const contest = await requireActiveContest();
  const team = await prisma.team.findFirst({ where: { id: teamId, contestId: contest.id, deletedAt: null } });
  if (!team) throw new UserError('Không tìm thấy lớp.');
  return team;
}

function generatePassword(length = 12) {
  let out = '';
  for (let i = 0; i < length; i++) out += PASSWORD_ALPHABET[randomInt(PASSWORD_ALPHABET.length)];
  return out;
}

export async function createUser(_prev: ActionState, form: FormData) {
  return runAction(async () => {
    const actor = await requireSuperAdminWithPassword(form.get('confirmPassword'));
    const base = z
      .object({ name: z.string().trim().min(1, 'Nhập họ tên').max(120), password, role: roleCode })
      .parse({ name: str(form, 'name'), password: String(form.get('password') ?? ''), role: str(form, 'role') });
    const role = await prisma.role.findUniqueOrThrow({ where: { code: base.role } });

    let data: { email: string | null; username: string | null; teamId: string | null };
    if (base.role === 'TEAM') {
      // Tài khoản lớp: tên đăng nhập + lớp, không cần email.
      const team = await resolveTeam(str(form, 'teamId'));
      data = { email: null, username: username.parse(str(form, 'username')), teamId: team.id };
    } else {
      data = { email: z.string().trim().toLowerCase().email('Email không hợp lệ').parse(str(form, 'email')), username: null, teamId: null };
    }

    const user = await prisma.user.create({
      data: { ...data, name: base.name, passwordHash: await hashPassword(base.password), roleId: role.id },
    });
    await audit({
      userId: actor.id,
      action: 'user.create',
      entityType: 'User',
      entityId: user.id,
      after: { email: user.email, username: user.username, teamId: user.teamId, role: base.role },
    });
    revalidatePath('/admin/users');
    return `Đã tạo tài khoản ${user.username ?? user.email}.`;
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

    let teamId: string | null = null;
    let newUsername = target.username;
    if (role === 'TEAM') {
      teamId = (await resolveTeam(str(form, 'teamId'))).id;
      const raw = str(form, 'username');
      if (raw) newUsername = username.parse(raw);
      if (!newUsername && !target.email) throw new UserError('Tài khoản lớp cần tên đăng nhập.');
    }

    const newPassword = String(form.get('newPassword') ?? '');
    const roleRow = await prisma.role.findUniqueOrThrow({ where: { code: role } });
    const securityChanged =
      !!newPassword || role !== target.role.code || isActive !== target.isActive || teamId !== target.teamId || newUsername !== target.username;
    const updated = await prisma.user.update({
      where: { id },
      data: {
        roleId: roleRow.id,
        isActive,
        teamId,
        username: newUsername,
        name: z.string().trim().min(1).max(120).parse(str(form, 'name')),
        ...(newPassword ? { passwordHash: await hashPassword(password.parse(newPassword)), failedLogins: 0, lockedUntil: null } : {}),
        // Đổi quyền / lớp / khóa / đổi mật khẩu: đăng xuất mọi phiên cũ.
        ...(securityChanged ? { sessionVersion: { increment: 1 } } : {}),
      },
    });
    await audit({
      userId: actor.id,
      action: 'user.update',
      entityType: 'User',
      entityId: id,
      before: { role: target.role.code, isActive: target.isActive, teamId: target.teamId, username: target.username },
      after: { role, isActive: updated.isActive, teamId: updated.teamId, username: updated.username, passwordChanged: !!newPassword },
    });
    revalidatePath('/admin/users');
    return 'Đã cập nhật tài khoản.';
  });
}

/**
 * Tạo tài khoản cho mọi lớp chưa có tài khoản lớp. Mật khẩu ngẫu nhiên chỉ hiện 1 lần trong kết quả
 * (DB chỉ lưu bản băm) — cần chép lại ngay để phát cho từng lớp.
 */
export async function createTeamAccounts(_prev: ActionState, form: FormData) {
  return runAction(async () => {
    const actor = await requireSuperAdminWithPassword(form.get('confirmPassword'));
    const contest = await requireActiveContest();
    const [teams, role, existing] = await Promise.all([
      prisma.team.findMany({
        where: { contestId: contest.id, deletedAt: null },
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
        include: { users: { where: { deletedAt: null, role: { code: 'TEAM' } }, select: { id: true } } },
      }),
      prisma.role.findUniqueOrThrow({ where: { code: 'TEAM' } }),
      prisma.user.findMany({ where: { username: { not: null } }, select: { username: true } }),
    ]);
    const missing = teams.filter((t) => t.users.length === 0);
    if (missing.length === 0) throw new UserError('Mọi lớp đều đã có tài khoản.');

    const taken = new Set(existing.map((u) => u.username!));
    const lines: string[] = [];
    for (const team of missing) {
      const name = suggestUsername(team.className || team.name, taken);
      taken.add(name);
      const pass = generatePassword();
      const user = await prisma.user.create({
        data: { username: name, name: `${team.className} · ${team.name}`, passwordHash: await hashPassword(pass), roleId: role.id, teamId: team.id },
      });
      await audit({ userId: actor.id, action: 'user.create', entityType: 'User', entityId: user.id, after: { username: name, teamId: team.id, role: 'TEAM', bulk: true } });
      lines.push(`${team.className} · ${team.name}  —  tên đăng nhập: ${name}  —  mật khẩu: ${pass}`);
    }
    revalidatePath('/admin/users');
    return [
      `Đã tạo ${missing.length} tài khoản lớp. Hãy chép lại ngay, mật khẩu chỉ hiện 1 lần:`,
      '',
      ...lines,
    ].join('\n');
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

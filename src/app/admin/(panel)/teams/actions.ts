'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import type { ActionState } from '@/lib/action';
import { runAction, str, int, UserError } from '@/server/action';
import { audit } from '@/server/audit';
import { requireAdmin } from '@/server/auth';
import { invalidatePublic } from '@/server/cache';
import { requireActiveContest } from '@/server/contest';
import { prisma } from '@/server/db';

const schema = z.object({
  name: z.string().min(1, 'Nhập tên đội').max(120),
  className: z.string().min(1, 'Nhập tên lớp').max(120),
  leaderName: z.string().max(200),
  members: z.string().max(3000),
  sortOrder: z.number().int().min(0).max(9999),
});

function read(form: FormData) {
  return schema.parse({
    name: str(form, 'name'),
    className: str(form, 'className'),
    leaderName: str(form, 'leaderName'),
    members: str(form, 'members'),
    sortOrder: int(form, 'sortOrder'),
  });
}

function done() {
  invalidatePublic();
  revalidatePath('/admin/teams');
}

export async function createTeam(_prev: ActionState, form: FormData) {
  return runAction(async () => {
    const user = await requireAdmin();
    const contest = await requireActiveContest();
    const data = read(form);
    const team = await prisma.team.create({ data: { ...data, leaderName: data.leaderName || null, members: data.members || null, contestId: contest.id } });
    await audit({ userId: user.id, action: 'team.create', entityType: 'Team', entityId: team.id, after: team });
    done();
    return `Đã tạo đội “${team.name}”.`;
  });
}

export async function updateTeam(_prev: ActionState, form: FormData) {
  return runAction(async () => {
    const user = await requireAdmin();
    const id = str(form, 'id');
    const before = await prisma.team.findFirst({ where: { id, deletedAt: null } });
    if (!before) throw new UserError('Không tìm thấy đội.');
    const data = read(form);
    const team = await prisma.team.update({ where: { id }, data: { ...data, leaderName: data.leaderName || null, members: data.members || null } });
    await audit({ userId: user.id, action: 'team.update', entityType: 'Team', entityId: id, before, after: team });
    done();
    return 'Đã cập nhật đội.';
  });
}

export async function deleteTeam(_prev: ActionState, form: FormData) {
  return runAction(async () => {
    const user = await requireAdmin();
    const id = str(form, 'id');
    const team = await prisma.team.findFirst({ where: { id, deletedAt: null }, include: { product: true } });
    if (!team) throw new UserError('Không tìm thấy đội.');
    if (team.product && !team.product.deletedAt) throw new UserError('Hãy xóa sản phẩm của đội trước.');
    // Đổi tên khi xóa mềm để không chặn ràng buộc UNIQUE(contest, name).
    await prisma.team.update({ where: { id }, data: { deletedAt: new Date(), name: `${team.name} (đã xóa ${Date.now()})` } });
    await audit({ userId: user.id, action: 'team.delete', entityType: 'Team', entityId: id, before: team });
    done();
    return 'Đã xóa đội.';
  });
}

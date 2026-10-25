'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import type { ActionState } from '@/lib/action';
import { int, runAction, str, UserError } from '@/server/action';
import { audit } from '@/server/audit';
import { requireAdmin } from '@/server/auth';
import { invalidate } from '@/server/cache';
import { prisma } from '@/server/db';

const schema = z.object({ name: z.string().trim().min(1, 'Nhập tên giáo khu').max(120), sortOrder: z.number().int().min(0).max(999) });

export async function saveZone(_prev: ActionState, form: FormData) {
  return runAction(async () => {
    const user = await requireAdmin();
    const id = str(form, 'id');
    const data = schema.parse({ name: str(form, 'name'), sortOrder: int(form, 'sortOrder') });
    const zone = id ? await prisma.zone.update({ where: { id }, data }) : await prisma.zone.create({ data });
    await audit({ userId: user.id, action: id ? 'zone.update' : 'zone.create', entityType: 'Zone', entityId: zone.id, after: zone });
    invalidate('r:');
    revalidatePath('/admin/zones');
    return 'Đã lưu giáo khu.';
  });
}

export async function deleteZone(_prev: ActionState, form: FormData) {
  return runAction(async () => {
    const user = await requireAdmin();
    const id = str(form, 'id');
    const used = await prisma.voteToken.count({ where: { zoneId: id } });
    if (used > 0) throw new UserError('Giáo khu đang được gán cho phiếu, không thể xóa.');
    const zone = await prisma.zone.update({ where: { id }, data: { deletedAt: new Date(), name: `deleted-${Date.now()}-${id}` } });
    await audit({ userId: user.id, action: 'zone.delete', entityType: 'Zone', entityId: id, before: zone });
    invalidate('r:');
    revalidatePath('/admin/zones');
    return 'Đã xóa giáo khu.';
  });
}

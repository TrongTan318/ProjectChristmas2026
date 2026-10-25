'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import type { ActionState } from '@/lib/action';
import { runAction, str, UserError } from '@/server/action';
import { audit } from '@/server/audit';
import { requireSuperAdminWithPassword } from '@/server/auth';
import { invalidate } from '@/server/cache';
import { prisma } from '@/server/db';

/** Hủy phiếu gian lận: phiếu không còn được tính, token vẫn khóa vĩnh viễn. */
export async function invalidateVote(_prev: ActionState, form: FormData) {
  return runAction(async () => {
    const user = await requireSuperAdminWithPassword(form.get('password'));
    const id = str(form, 'id');
    const reason = z.string().trim().min(3, 'Nhập lý do hủy (ít nhất 3 ký tự)').max(300).parse(str(form, 'reason'));
    const vote = await prisma.vote.findFirst({ where: { id, deletedAt: null } });
    if (!vote) throw new UserError('Không tìm thấy phiếu bầu.');
    if (vote.status === 'INVALIDATED') throw new UserError('Phiếu này đã bị hủy trước đó.');
    const updated = await prisma.vote.update({
      where: { id },
      data: { status: 'INVALIDATED', invalidReason: reason, invalidatedAt: new Date(), invalidatedById: user.id },
    });
    await audit({ userId: user.id, action: 'vote.invalidate', entityType: 'Vote', entityId: id, before: vote, after: updated });
    invalidate('r:');
    revalidatePath('/admin/votes');
    return 'Đã hủy phiếu bầu.';
  });
}

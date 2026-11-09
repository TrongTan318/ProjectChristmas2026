'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { formatSerial } from '@/domain/token';
import type { ActionState } from '@/lib/action';
import { runAction, str, UserError } from '@/server/action';
import { audit } from '@/server/audit';
import { requireSuperAdminWithPassword } from '@/server/auth';
import { invalidate } from '@/server/cache';
import { requireActiveContest } from '@/server/contest';
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

/**
 * Gỡ phiếu bầu (bầu nhầm, phiếu thử): xóa lượt bầu và mở lại token để quét/nhập lại.
 * Ngoại lệ có kiểm soát của quy tắc "USED không quay lại ACTIVE": Super Admin + mật khẩu + lý do,
 * bản ghi phiếu bầu đầy đủ được lưu trong nhật ký (`before`). Xóa hẳn vì UNIQUE(token_id).
 */
export async function resetVote(_prev: ActionState, form: FormData) {
  return runAction(async () => {
    const user = await requireSuperAdminWithPassword(form.get('password'));
    const contest = await requireActiveContest();
    const serial = z.coerce.number({ message: 'Nhập số seri in trên phiếu' }).int().positive('Số seri không hợp lệ').parse(str(form, 'serial'));
    const reason = z.string().trim().min(3, 'Nhập lý do gỡ (ít nhất 3 ký tự)').max(300).parse(str(form, 'reason'));
    const vote = await prisma.vote.findFirst({
      where: { contestId: contest.id, deletedAt: null, token: { serial } },
      include: { token: true, product: { select: { name: true } } },
    });
    if (!vote) throw new UserError(`Phiếu số ${formatSerial(serial)} chưa được dùng để bầu (hoặc không tồn tại), không cần gỡ.`);
    const id = vote.id;

    await prisma.$transaction(async (tx) => {
      const reopened = await tx.voteToken.updateMany({
        where: { id: vote.tokenId, status: 'USED' },
        data: { status: 'ACTIVE', usedAt: null },
      });
      if (reopened.count !== 1) throw new UserError('Phiếu này không ở trạng thái đã dùng (có thể đã bị vô hiệu), không gỡ được.');
      await tx.vote.delete({ where: { id } });
    });

    await audit({
      userId: user.id,
      action: 'vote.reset',
      entityType: 'Vote',
      entityId: id,
      before: { ...vote, reason },
      after: { tokenId: vote.tokenId, serial: vote.token.serial, tokenStatus: 'ACTIVE' },
    });
    invalidate('r:');
    revalidatePath('/admin/votes');
    revalidatePath('/admin/tokens');
    return `Đã gỡ phiếu số ${formatSerial(vote.token.serial)} (${vote.product.name}). Phiếu dùng lại được.`;
  });
}

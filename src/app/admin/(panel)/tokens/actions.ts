'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import type { ActionState } from '@/lib/action';
import { runAction, str, UserError } from '@/server/action';
import { audit } from '@/server/audit';
import { requireAdmin, requireSuperAdminWithPassword } from '@/server/auth';
import { invalidate } from '@/server/cache';
import { requireActiveContest } from '@/server/contest';
import { prisma } from '@/server/db';

const revokeSchema = z
  .object({
    from: z.coerce.number().int().min(1, 'Số seri không hợp lệ'),
    to: z.coerce.number().int().min(1, 'Số seri không hợp lệ'),
    reason: z.string().trim().min(3, 'Nhập lý do (ít nhất 3 ký tự)').max(300),
  })
  .refine((v) => v.to >= v.from, 'Seri “đến” phải ≥ seri “từ”')
  .refine((v) => v.to - v.from < 5000, 'Tối đa 5000 phiếu mỗi lần');

/** Vô hiệu phiếu chưa dùng theo dải seri (phiếu mất, hỏng, lộ). Phiếu đã dùng giữ nguyên. */
export async function revokeTokens(_prev: ActionState, form: FormData) {
  return runAction(async () => {
    const user = await requireSuperAdminWithPassword(form.get('password'));
    const contest = await requireActiveContest();
    const input = revokeSchema.parse({ from: str(form, 'from'), to: str(form, 'to') || str(form, 'from'), reason: str(form, 'reason') });
    const result = await prisma.voteToken.updateMany({
      where: { contestId: contest.id, serial: { gte: input.from, lte: input.to }, status: 'ACTIVE', deletedAt: null },
      data: { status: 'REVOKED', revokedAt: new Date(), revokeReason: input.reason },
    });
    await audit({ userId: user.id, action: 'token.revoke', entityType: 'VoteToken', after: { ...input, count: result.count } });
    invalidate('r:');
    revalidatePath('/admin/tokens');
    if (result.count === 0) throw new UserError('Không có phiếu chưa dùng nào trong dải seri này.');
    return `Đã vô hiệu ${result.count} phiếu.`;
  });
}

export async function updateBatchZone(_prev: ActionState, form: FormData) {
  return runAction(async () => {
    const user = await requireAdmin();
    const batchId = str(form, 'batchId');
    const zoneId = str(form, 'zoneId') || null;
    const batch = await prisma.tokenBatch.findFirst({ where: { id: batchId, deletedAt: null } });
    if (!batch) throw new UserError('Không tìm thấy lô phiếu.');
    if (zoneId && !(await prisma.zone.findFirst({ where: { id: zoneId, deletedAt: null } }))) throw new UserError('Giáo khu không hợp lệ.');
    // Cập nhật cả phiếu bầu đã có để thống kê theo giáo khu luôn khớp.
    await prisma.$transaction([
      prisma.tokenBatch.update({ where: { id: batchId }, data: { zoneId } }),
      prisma.voteToken.updateMany({ where: { batchId }, data: { zoneId } }),
      prisma.vote.updateMany({ where: { token: { batchId } }, data: { zoneId } }),
    ]);
    await audit({ userId: user.id, action: 'token.batch.zone', entityType: 'TokenBatch', entityId: batchId, before: { zoneId: batch.zoneId }, after: { zoneId } });
    invalidate('r:');
    revalidatePath('/admin/tokens');
    return 'Đã cập nhật giáo khu cho lô phiếu.';
  });
}

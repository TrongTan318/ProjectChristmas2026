'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import type { ActionState } from '@/lib/action';
import { runAction, str, UserError } from '@/server/action';
import { audit } from '@/server/audit';
import { requireSuperAdminWithPassword } from '@/server/auth';
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

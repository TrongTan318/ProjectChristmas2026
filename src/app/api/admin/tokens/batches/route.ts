import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { audit } from '@/server/audit';
import { getCurrentAdmin, isSuperAdmin, verifyPassword } from '@/server/auth';
import { invalidate } from '@/server/cache';
import { requireActiveContest } from '@/server/contest';
import { prisma } from '@/server/db';
import { env } from '@/server/env';
import { renderBallotsPdf } from '@/server/reports/ballots';
import { isSameOrigin } from '@/server/request';
import { createTokenBatch, MAX_BATCH } from '@/server/services/tokens';

const schema = z.object({
  quantity: z.coerce.number().int().min(1, 'Số lượng tối thiểu là 1').max(MAX_BATCH, `Tối đa ${MAX_BATCH} phiếu mỗi lô`),
  zoneId: z.string().max(40).optional().transform((v) => v || null),
  label: z.string().trim().min(1, 'Nhập tên lô').max(120),
  password: z.string().min(1, 'Nhập mật khẩu xác nhận'),
});

/**
 * Sinh lô phiếu và trả về PDF ngay trong cùng request.
 * Token gốc không được lưu nên PDF chỉ tải được một lần duy nhất.
 */
export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: 'Yêu cầu không hợp lệ.' }, { status: 403 });
  const user = await getCurrentAdmin();
  if (!user) return NextResponse.json({ error: 'Phiên đăng nhập đã hết hạn.' }, { status: 401 });
  if (!isSuperAdmin(user)) return NextResponse.json({ error: 'Chỉ Super Admin được sinh phiếu.' }, { status: 403 });

  const parsed = schema.safeParse(Object.fromEntries((await request.formData()).entries()));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues.map((i) => i.message).join(' · ') }, { status: 400 });
  const input = parsed.data;
  if (!(await verifyPassword(user.passwordHash, input.password))) {
    return NextResponse.json({ error: 'Mật khẩu xác nhận không đúng.' }, { status: 403 });
  }

  const contest = await requireActiveContest();
  const zone = input.zoneId ? await prisma.zone.findFirst({ where: { id: input.zoneId, deletedAt: null } }) : null;
  if (input.zoneId && !zone) return NextResponse.json({ error: 'Giáo khu không hợp lệ.' }, { status: 400 });

  const { batch, ballots } = await createTokenBatch({
    contestId: contest.id,
    quantity: input.quantity,
    zoneId: zone?.id ?? null,
    label: input.label,
    userId: user.id,
  });
  await audit({
    userId: user.id,
    action: 'token.batch.create',
    entityType: 'TokenBatch',
    entityId: batch.id,
    after: { label: batch.label, quantity: batch.quantity, serialFrom: batch.serialFrom, serialTo: batch.serialTo, zone: zone?.name },
  });
  invalidate('r:');

  const pdf = await renderBallotsPdf(ballots, {
    contestName: contest.name,
    organizer: contest.organizer,
    baseUrl: env().PUBLIC_BASE_URL,
    zoneName: zone?.name,
  });

  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="phieu-binh-chon-${batch.serialFrom}-${batch.serialTo}.pdf"`,
      'Cache-Control': 'no-store',
    },
  });
}

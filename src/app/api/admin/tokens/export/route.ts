import type { TokenStatus } from '@prisma/client';
import { NextResponse, type NextRequest } from 'next/server';
import { audit } from '@/server/audit';
import { getCurrentAdmin } from '@/server/auth';
import { requireActiveContest } from '@/server/contest';
import { buildTokensWorkbook } from '@/server/reports/excel';

const STATUSES: TokenStatus[] = ['ACTIVE', 'USED', 'REVOKED'];
const SLUG: Record<TokenStatus, string> = { ACTIVE: 'chua-dung', USED: 'da-dung', REVOKED: 'vo-hieu' };

/** Xuất Excel tất cả phiếu, lọc theo `?status=ACTIVE|USED|REVOKED` (bỏ trống = tất cả). */
export async function GET(request: NextRequest) {
  const user = await getCurrentAdmin();
  if (!user) return NextResponse.json({ error: 'Phiên đăng nhập đã hết hạn.' }, { status: 401 });

  const raw = request.nextUrl.searchParams.get('status') ?? '';
  const status = STATUSES.includes(raw as TokenStatus) ? (raw as TokenStatus) : undefined;
  const contest = await requireActiveContest();
  const file = await buildTokensWorkbook(contest, status);
  await audit({ userId: user.id, action: 'report.tokens.excel', entityType: 'Contest', entityId: contest.id, after: { status: status ?? 'ALL' } });

  const stamp = new Date().toISOString().slice(0, 16).replace(/[-:T]/g, '');
  return new NextResponse(new Uint8Array(file), {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="danh-sach-phieu-${status ? SLUG[status] : 'tat-ca'}-${stamp}.xlsx"`,
      'Cache-Control': 'no-store',
    },
  });
}

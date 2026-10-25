import { NextResponse } from 'next/server';
import { audit } from '@/server/audit';
import { getCurrentAdmin } from '@/server/auth';
import { requireActiveContest } from '@/server/contest';
import { buildResultsWorkbook } from '@/server/reports/excel';
import { buildResultsPdf } from '@/server/reports/results-pdf';

export async function GET(_request: Request, { params }: { params: Promise<{ format: string }> }) {
  const user = await getCurrentAdmin();
  if (!user) return NextResponse.json({ error: 'Phiên đăng nhập đã hết hạn.' }, { status: 401 });
  const { format } = await params;
  const contest = await requireActiveContest();
  const stamp = new Date().toISOString().slice(0, 16).replace(/[-:T]/g, '');

  if (format === 'excel') {
    const file = await buildResultsWorkbook(contest);
    await audit({ userId: user.id, action: 'report.excel', entityType: 'Contest', entityId: contest.id });
    return new NextResponse(new Uint8Array(file), {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="ket-qua-binh-chon-${stamp}.xlsx"`,
        'Cache-Control': 'no-store',
      },
    });
  }
  if (format === 'pdf') {
    const file = await buildResultsPdf(contest, user.name);
    await audit({ userId: user.id, action: 'report.pdf', entityType: 'Contest', entityId: contest.id });
    return new NextResponse(new Uint8Array(file), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="bien-ban-ket-qua-${stamp}.pdf"`,
        'Cache-Control': 'no-store',
      },
    });
  }
  return NextResponse.json({ error: 'Định dạng không hỗ trợ.' }, { status: 404 });
}

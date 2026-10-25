import { getVotingState } from '@/domain/voting';
import { Card, PageHeader, Stat, btn } from '@/components/admin/ui';
import { formatDateTime, formatNumber } from '@/lib/format';
import { requireAdmin } from '@/server/auth';
import { requireActiveContest } from '@/server/contest';
import { prisma } from '@/server/db';
import { getResults, getVotesByDay, getVotesByHour } from '@/server/services/results';
import { BarChartCard, LineChartCard } from './Charts';

const STATE_LABEL = {
  OPEN: { text: 'Đang mở bình chọn', cls: 'bg-emerald-100 text-emerald-800' },
  LOCKED: { text: 'Đang khóa bình chọn', cls: 'bg-red-100 text-red-800' },
  NOT_STARTED: { text: 'Chưa đến giờ mở', cls: 'bg-amber-100 text-amber-800' },
  ENDED: { text: 'Đã hết giờ bình chọn', cls: 'bg-zinc-200 text-zinc-800' },
};

export default async function DashboardPage() {
  await requireAdmin();
  const contest = await requireActiveContest();
  const [results, byDay, byHour, teams, products, views] = await Promise.all([
    getResults(contest.id),
    getVotesByDay(contest.id),
    getVotesByHour(contest.id),
    prisma.team.count({ where: { contestId: contest.id, deletedAt: null } }),
    prisma.product.groupBy({ by: ['status'], where: { contestId: contest.id, deletedAt: null }, _count: { _all: true } }),
    prisma.product.aggregate({ where: { contestId: contest.id, deletedAt: null }, _sum: { viewCount: true } }),
  ]);
  const published = products.find((p) => p.status === 'PUBLISHED')?._count._all ?? 0;
  const totalProducts = products.reduce((s, p) => s + p._count._all, 0);
  const state = STATE_LABEL[getVotingState(contest)];
  const t = results.totals;

  return (
    <div>
      <PageHeader
        title="Tổng quan"
        description={`Cập nhật ${formatDateTime(results.updatedAt)}`}
        actions={
          <>
            <a className={btn.secondary} href="/api/admin/export/excel">⬇ Xuất Excel</a>
            <a className={btn.secondary} href="/api/admin/export/pdf">⬇ Xuất PDF</a>
          </>
        }
      />

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <span className={`rounded-full px-3 py-1 text-sm font-semibold ${state.cls}`}>{state.text}</span>
        <span className="text-sm text-zinc-600">
          Mở: {formatDateTime(contest.votingStartAt)} → Đóng: {formatDateTime(contest.votingEndAt)}
        </span>
        <span className="text-sm text-zinc-600">
          · Kết quả công khai: <strong>{contest.resultsPublic ? 'Bật' : 'Tắt'}</strong>
          {contest.resultsPublic && ` (realtime: ${contest.resultsRealtime ? 'bật' : 'tắt'})`}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Stat label="Tổng số đội" value={teams} />
        <Stat label="Sản phẩm" value={totalProducts} hint={`${published} đã xuất bản`} />
        <Stat label="Tổng lượt xem" value={formatNumber(views._sum.viewCount ?? 0)} />
        <Stat label="Phiếu bầu hợp lệ" value={formatNumber(t.validVotes)} tone="burgundy" hint={t.invalidVotes ? `${t.invalidVotes} phiếu bị hủy` : undefined} />
        <Stat label="Tổng phiếu phát hành" value={formatNumber(t.issued)} />
        <Stat label="Phiếu đã dùng" value={formatNumber(t.used)} tone="green" hint={t.issued ? `${((t.used / t.issued) * 100).toFixed(1)}%` : undefined} />
        <Stat label="Phiếu chưa dùng" value={formatNumber(t.remaining)} tone="gold" />
        <Stat label="Phiếu vô hiệu" value={formatNumber(t.revoked)} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card title="Top sản phẩm">
          <ol className="space-y-2">
            {results.ranking.slice(0, 10).map((r) => (
              <li key={r.productId} className="flex items-center gap-3 text-sm">
                <span className="w-6 text-right font-bold text-zinc-500">{r.rank}</span>
                <span className="min-w-0 flex-1 truncate">
                  <span className="font-medium">{r.name}</span> <span className="text-zinc-500">· {r.className}</span>
                </span>
                <span className="w-24 overflow-hidden rounded-full bg-zinc-100">
                  <span className="block h-2 rounded-full bg-burgundy" style={{ width: `${r.percent}%` }} />
                </span>
                <span className="w-12 text-right font-semibold tabular-nums">{r.votes}</span>
              </li>
            ))}
            {results.ranking.length === 0 && <p className="text-sm text-zinc-500">Chưa có sản phẩm xuất bản.</p>}
          </ol>
        </Card>
        <BarChartCard title="Phiếu theo giáo khu" data={results.byZone.map((z) => ({ label: z.name, value: z.votes }))} />
        <LineChartCard title="Phiếu theo ngày" data={byDay.map((d) => ({ label: d.day.slice(5).split('-').reverse().join('/'), value: d.votes }))} />
        <BarChartCard
          title="Phiếu theo khung giờ"
          data={Array.from({ length: 24 }, (_, h) => ({ label: `${h}h`, value: byHour.find((x) => x.hour === h)?.votes ?? 0 }))}
        />
      </div>
    </div>
  );
}

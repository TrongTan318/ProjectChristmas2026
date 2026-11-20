import Link from 'next/link';
import { Card, PageHeader, btn } from '@/components/admin/ui';
import { groupByStage } from '@/domain/stage';
import { cn } from '@/lib/format';
import { MAX_IMAGES_PER_STAGE } from '@/lib/limits';
import { requireAdmin } from '@/server/auth';
import { getSiteSettings, requireActiveContest, stageLabels } from '@/server/contest';
import { prisma } from '@/server/db';
import { ImageManager } from '../products/[id]/ImageManager';

/** Tải ảnh lên từng đội theo 3 giai đoạn; ảnh hiện ở trang chi tiết đội (/trien-lam/<slug>). */
export default async function StagesPage({ searchParams }: { searchParams: Promise<{ team?: string }> }) {
  await requireAdmin();
  const contest = await requireActiveContest();
  const [{ team: teamParam }, settings, teams] = await Promise.all([
    searchParams,
    getSiteSettings(contest.id),
    prisma.team.findMany({
      where: { contestId: contest.id, deletedAt: null },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            status: true,
            deletedAt: true,
            images: {
              where: { deletedAt: null, stage: { not: null } },
              orderBy: { sortOrder: 'asc' },
              select: { id: true, key: true, alt: true, isCover: true, stage: true, sortOrder: true },
            },
          },
        },
      },
    }),
  ]);
  const labels = stageLabels(settings);
  const selected = teams.find((t) => t.id === teamParam) ?? teams[0];
  const product = selected?.product && !selected.product.deletedAt ? selected.product : null;
  const byStage = groupByStage(product?.images ?? []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ảnh giai đoạn"
        description="Tải ảnh của từng đội theo 3 giai đoạn. Trên trang chi tiết đội, các giai đoạn xếp từ mới nhất (3) xuống (1)."
        actions={<Link href="/admin/settings#giai-doan" className={btn.secondary}>Đổi tên / ẩn giai đoạn</Link>}
      />

      <Card title="Chọn đội">
        {teams.length === 0 ? (
          <p className="text-sm text-zinc-500">
            Chưa có đội nào. <Link href="/admin/teams" className="underline">Thêm đội thi</Link> trước.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {teams.map((t) => {
              const counts = groupByStage(t.product && !t.product.deletedAt ? t.product.images : []);
              return (
                <Link
                  key={t.id}
                  href={`/admin/stages?team=${t.id}`}
                  aria-current={t.id === selected?.id ? 'page' : undefined}
                  className={cn(
                    'rounded-lg border px-3 py-2 text-sm transition-colors',
                    t.id === selected?.id ? 'border-burgundy bg-burgundy text-ivory' : 'border-zinc-300 bg-white hover:border-burgundy',
                  )}
                >
                  <span className="font-medium">{t.className}</span>
                  <span className={t.id === selected?.id ? 'text-ivory/80' : 'text-zinc-500'}> · {t.name}</span>
                  <span className={cn('ml-2 text-xs tabular-nums', t.id === selected?.id ? 'text-ivory/80' : 'text-zinc-500')} title="Số ảnh giai đoạn 1 · 2 · 3">
                    {counts[1].length}·{counts[2].length}·{counts[3].length}
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </Card>

      {selected && !product && (
        <p className="rounded-lg bg-amber-50 p-4 text-sm text-amber-900">
          Đội <strong>{selected.name}</strong> chưa có sản phẩm. Hãy <Link href="/admin/products" className="underline">tạo sản phẩm</Link> cho đội trước rồi quay lại tải ảnh.
        </p>
      )}

      {selected && product && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">
              {selected.className} · {selected.name} — <span className="font-normal text-zinc-600">{product.name}</span>
            </h2>
            {product.status === 'PUBLISHED' ? (
              <Link href={`/trien-lam/${product.slug}`} target="_blank" className={btn.secondary}>Xem trang đội ↗</Link>
            ) : (
              <span className="text-sm text-zinc-500">Sản phẩm đang ở trạng thái nháp (chưa hiện trên website).</span>
            )}
          </div>
          <p className="text-sm text-zinc-600">
            Bấm <strong>★ Đại diện</strong> trên một ảnh để dùng ảnh đó cho thẻ trong phòng triển lãm và khi chia sẻ link.
          </p>
          {labels.map(({ stage, title, note, enabled }) => (
            <Card key={stage} title={`${title} (${byStage[stage].length}/${MAX_IMAGES_PER_STAGE})${enabled ? '' : ' — đang ẩn trên website'}`}>
              {!enabled && (
                <p className="mb-4 rounded-lg bg-zinc-100 p-3 text-sm text-zinc-700">
                  Giai đoạn này đang ẩn với khách. Bật lại ở <Link href="/admin/settings#giai-doan" className="underline">Cài đặt</Link> khi muốn hiện.
                </p>
              )}
              {note && <p className="mb-4 text-sm text-zinc-600">{note}</p>}
              <ImageManager
                productId={product.id}
                stage={stage}
                max={MAX_IMAGES_PER_STAGE}
                images={byStage[stage].map((i) => ({ id: i.id, key: i.key, alt: i.alt, isCover: i.isCover }))}
              />
            </Card>
          ))}
        </>
      )}
    </div>
  );
}

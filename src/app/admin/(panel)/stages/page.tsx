import Link from 'next/link';
import { ActionForm, SubmitButton } from '@/components/admin/ActionForm';
import { Card, Checkbox, Field, Input, PageHeader, btn } from '@/components/admin/ui';
import {
  groupByStage,
  MAX_FEATURED,
  mergeStageLabels,
  parseFeaturedConfig,
  pickFeatured,
  STAGE_NOTE_MAX,
  STAGE_TITLE_MAX,
} from '@/domain/stage';
import { cn, teamLabel } from '@/lib/format';
import { MAX_IMAGES_PER_STAGE } from '@/lib/limits';
import { mediaUrl } from '@/lib/media';
import { isTeamUser, requireUser } from '@/server/auth';
import { getSiteSettings, requireActiveContest, stageLabels } from '@/server/contest';
import { prisma } from '@/server/db';
import { ImageManager } from '../products/[id]/ImageManager';
import { updateFeaturedConfig, updateStageConfig } from './actions';
import { LayoutPicker } from './LayoutPicker';
import { LayoutPreview } from './LayoutPreview';

/**
 * Tải ảnh lên từng lớp theo 3 giai đoạn; đổi tên / ẩn giai đoạn riêng từng lớp.
 * Quản trị viên: mọi lớp. Tài khoản lớp: chỉ lớp của mình (kiểm tra lại ở mọi action/API ảnh).
 */
export default async function StagesPage({ searchParams }: { searchParams: Promise<{ team?: string }> }) {
  const user = await requireUser();
  const teamUser = isTeamUser(user);
  const contest = await requireActiveContest();
  // Tài khoản lớp chưa gắn lớp (hoặc lớp đã xóa) → không thấy lớp nào.
  const ownTeamId = teamUser ? (user.team && !user.team.deletedAt ? user.teamId : '__none__') : null;
  const [{ team: teamParam }, settings, teams] = await Promise.all([
    searchParams,
    getSiteSettings(contest.id),
    prisma.team.findMany({
      where: { contestId: contest.id, deletedAt: null, ...(ownTeamId ? { id: ownTeamId } : {}) },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            status: true,
            deletedAt: true,
            stageConfig: true,
            images: {
              where: { deletedAt: null, stage: { not: null } },
              orderBy: { sortOrder: 'asc' },
              select: {
                id: true,
                key: true,
                alt: true,
                isCover: true,
                stage: true,
                sortOrder: true,
                width: true,
                height: true,
                blurDataUrl: true,
                featuredAt: true,
              },
            },
          },
        },
      },
    }),
  ]);
  const selected = teams.find((t) => t.id === teamParam) ?? teams[0];
  const product = selected?.product && !selected.product.deletedAt ? selected.product : null;
  const labels = mergeStageLabels(stageLabels(settings), product?.stageConfig);
  const byStage = groupByStage(product?.images ?? []);
  // Ảnh đẹp (♥): admin thấy tất cả ảnh đã ♥ (kể cả của giai đoạn đang ẩn), ghi chú ảnh nào không hiện.
  const featuredConfig = parseFeaturedConfig(product?.stageConfig);
  const allFeatured = pickFeatured(product?.images ?? [], [1, 2, 3]);
  const visibleStages: number[] = labels.filter((l) => l.enabled).map((l) => l.stage);
  const shownFeatured = pickFeatured(allFeatured, visibleStages);

  return (
    <div className="space-y-6">
      <PageHeader
        title={teamUser ? 'Ảnh của lớp' : 'Ảnh giai đoạn'}
        description="Tải ảnh theo 3 giai đoạn, đổi tên hoặc ẩn giai đoạn. Trên trang của lớp, các giai đoạn xếp từ mới nhất (3) xuống (1)."
        actions={!teamUser && <Link href="/admin/settings#giai-doan" className={btn.secondary}>Tên mặc định cho mọi lớp</Link>}
      />

      {teamUser && teams.length === 0 && (
        <p className="rounded-lg bg-amber-50 p-4 text-sm text-amber-900">
          Tài khoản của bạn chưa được gắn với lớp nào. Hãy liên hệ ban tổ chức.
        </p>
      )}

      {!teamUser && (
        <Card title="Chọn lớp">
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
                    {t.name && <span className={t.id === selected?.id ? 'text-ivory/80' : 'text-zinc-500'}> · {t.name}</span>}
                    <span className={cn('ml-2 text-xs tabular-nums', t.id === selected?.id ? 'text-ivory/80' : 'text-zinc-500')} title="Số ảnh giai đoạn 1 · 2 · 3">
                      {counts[1].length}·{counts[2].length}·{counts[3].length}
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </Card>
      )}

      {selected && !product && (
        <p className="rounded-lg bg-amber-50 p-4 text-sm text-amber-900">
          Lớp <strong>{teamLabel(selected)}</strong> chưa có sản phẩm.{' '}
          {teamUser ? (
            'Hãy liên hệ ban tổ chức để tạo sản phẩm cho lớp.'
          ) : (
            <>Hãy <Link href="/admin/products" className="underline">tạo sản phẩm</Link> cho đội trước rồi quay lại tải ảnh.</>
          )}
        </p>
      )}

      {selected && product && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">
              {teamLabel(selected)} — <span className="font-normal text-zinc-600">{product.name}</span>
            </h2>
            {product.status === 'PUBLISHED' ? (
              <Link href={`/trien-lam/${product.slug}`} target="_blank" className={btn.secondary}>Xem trang của lớp ↗</Link>
            ) : (
              <span className="text-sm text-zinc-500">Sản phẩm đang ở trạng thái nháp (chưa hiện trên website).</span>
            )}
          </div>

          <Card title={`♥ Ảnh đẹp (${allFeatured.length}/${MAX_FEATURED}) — khung đầu trang, không tiêu đề`}>
            <ActionForm action={updateFeaturedConfig} className="space-y-4">
              <input type="hidden" name="productId" value={product.id} />
              {allFeatured.length === 0 ? (
                <p className="rounded-lg bg-zinc-50 p-3 text-sm text-zinc-600">
                  Chưa có ảnh đẹp. Bấm <strong>♡ Ảnh đẹp</strong> trên các ảnh giai đoạn bên dưới để thêm (tối đa {MAX_FEATURED} ảnh). Khi chưa có ảnh
                  đẹp, trang của lớp không hiện khung này.
                </p>
              ) : (
                <div>
                  <ul className="flex flex-wrap gap-2">
                    {allFeatured.map((img, i) => {
                      const hidden = !visibleStages.includes(img.stage!);
                      return (
                        <li key={img.id} className="relative" title={hidden ? 'Thuộc giai đoạn đang ẩn — không hiện cho khách' : `Ảnh đẹp ${i + 1}`}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={mediaUrl(img.key, 400)} alt="" className={cn('h-16 w-16 rounded object-cover ring-2 ring-rose-500', hidden && 'opacity-40 grayscale')} />
                          <span className="absolute -top-1.5 -left-1.5 rounded-full bg-rose-600 px-1.5 text-[11px] font-bold text-white">{i + 1}</span>
                        </li>
                      );
                    })}
                  </ul>
                  <p className="mt-2 text-xs text-zinc-500">
                    Thứ tự theo lúc bấm ♥. Ảnh mờ thuộc giai đoạn đang ẩn nên khách không thấy. Bỏ ♥ ở ảnh bên dưới để gỡ.
                  </p>
                </div>
              )}
              <div className="grid gap-4 md:grid-cols-[minmax(0,22rem)_1fr] md:items-start">
                <LayoutPicker name="featuredLayout" value={featuredConfig.layout} label="Kiểu khung ảnh đẹp" />
                <div className="space-y-3">
                  <Checkbox name="featuredEnabled" label="Hiện trên website" defaultChecked={featuredConfig.enabled} />
                  <LayoutPreview
                    layoutField="featuredLayout"
                    badge="♥"
                    defaultTitle="Ảnh đẹp"
                    productName={product.name}
                    images={shownFeatured.map((i) => ({ key: i.key, width: i.width, height: i.height, alt: i.alt, blurDataUrl: i.blurDataUrl }))}
                  />
                  <SubmitButton>Lưu khung ảnh đẹp</SubmitButton>
                </div>
              </div>
            </ActionForm>
          </Card>

          <Card title="Tên, hiển thị và kiểu khung giai đoạn">
            <ActionForm action={updateStageConfig} className="space-y-4">
              <input type="hidden" name="productId" value={product.id} />
              <div className="grid gap-4 md:grid-cols-3">
                {labels.map((l) => (
                  <fieldset key={l.stage} className="space-y-3 rounded-lg border border-zinc-200 p-4">
                    <legend className="px-1 text-sm font-semibold text-zinc-700">Giai đoạn {l.stage}</legend>
                    <Field label="Tên giai đoạn">
                      <Input name={`title${l.stage}`} defaultValue={l.title} maxLength={STAGE_TITLE_MAX} placeholder={`Giai đoạn ${l.stage}`} />
                    </Field>
                    <Field label="Mô tả ngắn" hint="Không bắt buộc">
                      <Input name={`note${l.stage}`} defaultValue={l.note} maxLength={STAGE_NOTE_MAX} />
                    </Field>
                    <Checkbox name={`enabled${l.stage}`} label="Hiện trên website" defaultChecked={l.enabled} />
                    <LayoutPicker name={`layout${l.stage}`} value={l.layout} label={`Kiểu khung giai đoạn ${l.stage}`} />
                    <LayoutPreview
                      layoutField={`layout${l.stage}`}
                      titleField={`title${l.stage}`}
                      badge={String(l.stage)}
                      defaultTitle={l.title}
                      productName={product.name}
                      images={byStage[l.stage].map((i) => ({ key: i.key, width: i.width, height: i.height, alt: i.alt, blurDataUrl: i.blurDataUrl }))}
                    />
                  </fieldset>
                ))}
              </div>
              <p className="text-sm text-zinc-600">
                Bỏ chọn <strong>Hiện trên website</strong> để ẩn (xóa) giai đoạn với khách. Ảnh vẫn được giữ, chọn lại là hiện.
                Kiểu khung có giới hạn số ảnh (vd. Kim cương 5 ảnh) thì dùng các ảnh đầu tiên theo thứ tự bên dưới, khách bấm
                &quot;Xem tất cả&quot; để xem hết. Bấm <strong>👁 Xem thử</strong> để xem kiểu khung đang chọn trước khi lưu.
              </p>
              <SubmitButton>Lưu</SubmitButton>
            </ActionForm>
          </Card>

          <p className="text-sm text-zinc-600">
            Bấm <strong>★ Đại diện</strong> trên một ảnh để dùng ảnh đó cho thẻ trong phòng triển lãm và khi chia sẻ link.
            Bấm <strong>♡ Ảnh đẹp</strong> để đưa ảnh lên khung đầu trang của lớp. Dùng nút mũi tên để đổi vị trí ảnh trong giai đoạn.
          </p>
          {labels.map(({ stage, title, note, enabled }) => (
            <Card key={stage} title={`${title} (${byStage[stage].length}/${MAX_IMAGES_PER_STAGE})${enabled ? '' : ' — đang ẩn trên website'}`}>
              {!enabled && (
                <p className="mb-4 rounded-lg bg-zinc-100 p-3 text-sm text-zinc-700">
                  Giai đoạn này đang ẩn với khách. Chọn lại <strong>Hiện trên website</strong> ở khung phía trên khi muốn hiện.
                </p>
              )}
              {note && <p className="mb-4 text-sm text-zinc-600">{note}</p>}
              <ImageManager
                productId={product.id}
                stage={stage}
                max={MAX_IMAGES_PER_STAGE}
                images={byStage[stage].map((i) => ({ id: i.id, key: i.key, alt: i.alt, isCover: i.isCover, isFeatured: !!i.featuredAt }))}
              />
            </Card>
          ))}
        </>
      )}
    </div>
  );
}

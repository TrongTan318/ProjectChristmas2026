import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Ornament } from '@/components/site/Decor';
import { Reveal } from '@/components/site/Reveal';
import { VoteCodeDialog } from '@/components/site/VoteCodeDialog';
import { getVotingState } from '@/domain/voting';
import { StageGallery } from '@/components/site/StageGallery';
import { YouTubeFacade } from '@/components/site/YouTubeFacade';
import { splitParagraphs } from '@/lib/format';
import { fileUrl, mediaUrl } from '@/lib/media';
import { ViewCount } from '@/components/site/ViewCount';
import { ViewTracker } from '@/components/site/ViewTracker';
import { StageLayoutView } from '@/components/site/layouts/StageLayoutView';
import { defaultOpenStage, groupByStage, mergeStageLabels, parseFeaturedConfig, pickFeatured } from '@/domain/stage';
import { getSiteSettings, requireActiveContest, stageLabels } from '@/server/contest';
import { getProductBySlug, listProducts } from '@/server/services/content';
import { getVoteSession } from '@/server/vote-session';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const contest = await requireActiveContest();
  const product = await getProductBySlug(contest.id, slug);
  if (!product) return { title: 'Không tìm thấy' };
  const cover = product.images[0];
  return {
    title: product.name,
    description: product.shortDescription || `Hang đá của ${product.team?.className ?? ''}`,
    openGraph: {
      title: `${product.name} — ${contest.name}`,
      description: product.shortDescription,
      type: 'article',
      images: cover ? [{ url: mediaUrl(cover.key, 1600), width: cover.width, height: cover.height }] : undefined,
    },
    twitter: { card: 'summary_large_image' },
  };
}

function Section({ title, children }: { title: string; children: string }) {
  const paragraphs = splitParagraphs(children);
  if (!paragraphs.length) return null;
  return (
    <Reveal>
      <section className="border-t border-gold-dark/25 pt-8">
        <h2 className="font-serif text-2xl font-semibold text-burgundy-dark sm:text-3xl">{title}</h2>
        <div className="prose-museum mt-4 text-lg leading-relaxed text-ink/85">
          {paragraphs.map((p, i) => (
            <p key={i} className="whitespace-pre-line">{p}</p>
          ))}
        </div>
      </section>
    </Reveal>
  );
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const contest = await requireActiveContest();
  const product = await getProductBySlug(contest.id, slug);
  if (!product) notFound();

  const [all, voteSession, settings] = await Promise.all([listProducts(contest.id), getVoteSession(), getSiteSettings(contest.id)]);
  // Khách chưa có phiên (chỉ bấm link, chưa quét QR) chỉ thấy nút bình chọn + popup nhập mã khi đang trong giờ bình chọn.
  const votingOpen = getVotingState(contest) === 'OPEN';

  // Tên/ẩn-hiện giai đoạn: cấu hình riêng của lớp ghi đè mặc định ở Cài đặt.
  // Chỉ giai đoạn đang bật; xếp từ mới nhất (3) xuống cũ nhất (1); mở sẵn giai đoạn mới nhất có ảnh.
  const byStage = groupByStage(product.images);
  const visible = mergeStageLabels(stageLabels(settings), product.stageConfig).filter((l) => l.enabled).reverse();
  const openStage = defaultOpenStage(visible.map((l) => ({ stage: l.stage, count: byStage[l.stage].length })));
  const stages = visible.map((l) => ({
    stage: l.stage,
    title: l.title,
    note: l.note,
    layout: l.layout,
    open: l.stage === openStage,
    images: byStage[l.stage].map((i) => ({ key: i.key, width: i.width, height: i.height, alt: i.alt, blurDataUrl: i.blurDataUrl })),
  }));
  // Ảnh đẹp (♥): khung đầu trang, không tiêu đề; chỉ ảnh của giai đoạn đang hiện.
  const featuredConfig = parseFeaturedConfig(product.stageConfig);
  const featured = featuredConfig.enabled
    ? pickFeatured(product.images, visible.map((l) => l.stage)).map((i) => ({ key: i.key, width: i.width, height: i.height, alt: i.alt, blurDataUrl: i.blurDataUrl }))
    : [];

  const position = all.findIndex((p) => p.id === product.id);
  const prev = position > 0 ? all[position - 1] : all[all.length - 1];
  const next = position < all.length - 1 ? all[position + 1] : all[0];
  const youtubeVideos = product.videos.filter((v) => v.kind === 'YOUTUBE' && v.youtubeId);
  const fileVideos = product.videos.filter((v) => v.kind === 'FILE' && v.fileKey);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: product.name,
    description: product.shortDescription,
    creator: { '@type': 'Organization', name: `${product.team?.className ?? ''} ${product.team?.name ?? ''}`.trim() },
    image: product.images.slice(0, 5).map((i) => mediaUrl(i.key, 1600)),
  };

  return (
    <article>
      <ViewTracker productId={product.id} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />

      <header className="bg-museum pt-28 pb-12 sm:pt-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <nav aria-label="Breadcrumb" className="text-sm text-ivory/60">
            <Link href="/trien-lam" className="hover:text-gold-light">← Phòng triển lãm</Link>
          </nav>
          <div className="mx-auto mt-8 max-w-3xl text-center">
            <p className="text-sm font-semibold tracking-[0.3em] text-gold uppercase">
              {product.team?.className}
              {product.team?.name ? ` · ${product.team.name}` : ''}
            </p>
            <h1 className="mt-4 font-serif text-4xl leading-tight font-bold text-gold-gradient sm:text-5xl">{product.name}</h1>
            <ViewCount count={product.viewCount} className="mt-3 text-sm text-ivory/60" />
            <Ornament className="mt-6" />
          </div>

          {/* Ảnh đẹp: hiện ngay khi vào trang, không tiêu đề, trên các giai đoạn */}
          {featured.length > 0 && (
            <section aria-label="Ảnh đẹp" className="mx-auto mt-8 max-w-4xl text-left">
              <StageLayoutView layout={featuredConfig.layout} images={featured} title={product.name} />
            </section>
          )}

          {/* Ảnh theo giai đoạn (3 → 2 → 1), nằm trên phần mô tả */}
          {stages.length > 0 && (
            <div className="mx-auto mt-8 max-w-4xl">
              <StageGallery stages={stages} productName={product.name} />
            </div>
          )}

          <div className="mx-auto max-w-3xl text-center">
            {product.shortDescription && (
              <p className="mt-6 text-lg leading-relaxed text-ivory/85 sm:text-xl">{product.shortDescription}</p>
            )}
            {product.team?.leaderName && (
              <p className="mt-6 text-sm text-ivory/60">Huynh trưởng phụ trách: {product.team.leaderName}</p>
            )}
            {voteSession ? (
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Link href={`/binh-chon?chon=${product.id}`} className="btn-glass text-lg">
                  ★ Bình chọn hang đá này
                </Link>
              </div>
            ) : (
              votingOpen && (
                <div className="mt-8 flex flex-wrap justify-center gap-3">
                  <VoteCodeDialog productId={product.id} productName={product.name} />
                </div>
              )
            )}
            {voteSession && (
              <Link href="/binh-chon" className="mt-4 inline-block text-ivory/70 underline hover:text-gold-light">
                ← Quay lại danh sách bình chọn
              </Link>
            )}
          </div>
        </div>
      </header>

      {(product.meaning.trim() || product.team?.members?.trim()) && (
        <div className="bg-parchment-texture py-16 sm:py-20">
          <div className="mx-auto max-w-3xl space-y-10 px-4 sm:px-6">
            <Section title="Ý nghĩa tác phẩm">{product.meaning}</Section>
            {product.team?.members && <Section title="Thành viên thực hiện">{product.team.members}</Section>}
          </div>
        </div>
      )}

      {(youtubeVideos.length > 0 || fileVideos.length > 0) && (
        <section className="bg-forest py-16 sm:py-20">
          <div className="mx-auto max-w-5xl space-y-10 px-4 sm:px-6">
            <h2 className="text-center font-serif text-3xl text-gold-gradient">Video</h2>
            {fileVideos.map((v) => (
              <div key={v.id} className="frame-gold">
                <div className="frame-inner">
                  <video controls preload="none" playsInline className="aspect-video w-full bg-ink" title={v.title || product.name}>
                    <source src={fileUrl(v.fileKey!)} type="video/mp4" />
                  </video>
                </div>
                {v.title && <p className="museum-plaque mt-3 rounded-sm px-4 py-2 text-center text-sm">{v.title}</p>}
              </div>
            ))}
            {youtubeVideos.map((v) => (
              <div key={v.id} className="frame-gold">
                <div className="frame-inner">
                  <YouTubeFacade videoId={v.youtubeId!} title={v.title || product.name} />
                </div>
                {v.title && <p className="museum-plaque mt-3 rounded-sm px-4 py-2 text-center text-sm">{v.title}</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      {all.length > 1 && prev && next && (
        <nav className="bg-museum border-t border-gold/20 py-10" aria-label="Tác phẩm khác">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
            <Link href={`/trien-lam/${prev.slug}`} className="group max-w-[45%]">
              <span className="text-sm text-ivory/60">← Tác phẩm trước</span>
              <span className="block truncate font-serif text-lg text-ivory group-hover:text-gold-light">{prev.name}</span>
            </Link>
            <Link href={`/trien-lam/${next.slug}`} className="group max-w-[45%] text-right">
              <span className="text-sm text-ivory/60">Tác phẩm tiếp →</span>
              <span className="block truncate font-serif text-lg text-ivory group-hover:text-gold-light">{next.name}</span>
            </Link>
          </div>
        </nav>
      )}
    </article>
  );
}

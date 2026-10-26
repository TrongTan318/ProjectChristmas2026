import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Ornament } from '@/components/site/Decor';
import { Gallery } from '@/components/site/Gallery';
import { Reveal } from '@/components/site/Reveal';
import { ShareButton } from '@/components/site/ShareButton';
import { YouTubeFacade } from '@/components/site/YouTubeFacade';
import { fileUrl, mediaUrl } from '@/lib/media';
import { ViewCount } from '@/components/site/ViewCount';
import { ViewTracker } from '@/components/site/ViewTracker';
import { requireActiveContest } from '@/server/contest';
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
  if (!children.trim()) return null;
  return (
    <Reveal>
      <section className="border-t border-gold-dark/25 pt-8">
        <h2 className="font-serif text-2xl font-semibold text-burgundy-dark sm:text-3xl">{title}</h2>
        <div className="prose-museum mt-4 text-lg leading-relaxed text-ink/85">
          {children.split(/\n{2,}/).map((p, i) => (
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

  const [all, voteSession] = await Promise.all([listProducts(contest.id), getVoteSession()]);

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
          <div className="mt-8 grid gap-10 lg:grid-cols-5 lg:gap-14">
            <div className="lg:col-span-3">
              <Gallery
                title={product.name}
                images={product.images.map((i) => ({ key: i.key, width: i.width, height: i.height, alt: i.alt, blurDataUrl: i.blurDataUrl }))}
              />
            </div>
            <div className="lg:col-span-2">
              <p className="text-sm font-semibold tracking-[0.3em] text-gold uppercase">
                {product.team?.className}
                {product.team?.name ? ` · ${product.team.name}` : ''}
              </p>
              <h1 className="mt-4 font-serif text-4xl leading-tight font-bold text-gold-gradient sm:text-5xl">{product.name}</h1>
              <ViewCount count={product.viewCount} className="mt-3 text-sm text-ivory/60" />
              <Ornament className="mt-6 !justify-start" />
              {product.shortDescription && (
                <p className="mt-6 text-lg leading-relaxed text-ivory/85 sm:text-xl">{product.shortDescription}</p>
              )}
              {product.christmasMessage && (
                <blockquote className="mt-8 border-l-2 border-gold pl-5 font-serif text-xl text-gold-light italic">
                  “{product.christmasMessage.split('\n')[0]}”
                </blockquote>
              )}
              {product.team?.leaderName && (
                <p className="mt-6 text-sm text-ivory/60">Huynh trưởng phụ trách: {product.team.leaderName}</p>
              )}
              <div className="mt-10 flex flex-wrap gap-3">
                {voteSession && (
                  <Link href={`/binh-chon?chon=${product.id}`} className="btn-gold text-lg">
                    ★ Bình chọn hang đá này
                  </Link>
                )}
                <ShareButton title={product.name} text={product.shortDescription} />
              </div>
              {voteSession && (
                <Link href="/binh-chon" className="mt-4 inline-block text-ivory/70 underline hover:text-gold-light">
                  ← Quay lại danh sách bình chọn
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="bg-parchment-texture py-16 sm:py-20">
        <div className="mx-auto max-w-3xl space-y-10 px-4 sm:px-6">
          <Section title="Ý tưởng thiết kế">{product.designIdea}</Section>
          <Section title="Ý nghĩa tôn giáo">{product.religiousMeaning}</Section>
          <Section title="Thông điệp Giáng Sinh">{product.christmasMessage}</Section>
          {product.team?.members && <Section title="Thành viên thực hiện">{product.team.members}</Section>}
        </div>
      </div>

      {(youtubeVideos.length > 0 || fileVideos.length > 0) && (
        <section className="bg-ink py-16 sm:py-20">
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

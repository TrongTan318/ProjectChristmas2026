import Link from 'next/link';
import { getVotingState } from '@/domain/voting';
import { Countdown } from '@/components/site/Countdown';
import { Ornament, SectionHeading } from '@/components/site/Decor';
import { Hero, type HeroSlide } from '@/components/site/Hero';
import { Picture } from '@/components/site/Picture';
import { ProductCard } from '@/components/site/ProductCard';
import { ResultsBoard } from '@/components/site/ResultsBoard';
import { Reveal } from '@/components/site/Reveal';
import { YouTubeFacade } from '@/components/site/YouTubeFacade';
import { formatDate } from '@/lib/format';
import { mediaUrl, parseYoutubeId } from '@/lib/media';
import { getSiteSettings, requireActiveContest } from '@/server/contest';
import { listAnnouncements, listBanners, listProducts, listSponsors } from '@/server/services/content';
import { getResults } from '@/server/services/results';

export default async function HomePage() {
  const contest = await requireActiveContest();
  const [settings, banners, products, news, sponsors] = await Promise.all([
    getSiteSettings(contest.id),
    listBanners(contest.id),
    listProducts(contest.id),
    listAnnouncements(contest.id, 3),
    listSponsors(contest.id),
  ]);
  const results = contest.resultsPublic ? await getResults(contest.id) : null;

  const slides: HeroSlide[] = banners.length
    ? banners.map((b) => ({ id: b.id, title: b.title, subtitle: b.subtitle, imageKey: b.imageKey, ctaLabel: b.ctaLabel, ctaUrl: b.ctaUrl }))
    : [{ id: 'default', title: settings.heroTitle, subtitle: settings.heroSubtitle, imageKey: null, ctaLabel: 'Vào triển lãm', ctaUrl: '/trien-lam' }];

  const now = new Date();
  const state = getVotingState(contest, now);
  const countdown =
    state === 'NOT_STARTED' && contest.votingStartAt
      ? { target: contest.votingStartAt, label: 'Bình chọn sẽ mở sau' }
      : state === 'OPEN' && contest.votingEndAt
        ? { target: contest.votingEndAt, label: 'Bình chọn sẽ kết thúc sau' }
        : null;

  const featured = products.filter((p) => p.isFeatured).slice(0, 3);
  const introVideoId = settings.introVideoUrl ? parseYoutubeId(settings.introVideoUrl) : null;

  return (
    <>
      <Hero slides={slides} organizer={contest.organizer} />

      {/* Giới thiệu */}
      <section className="bg-parchment-texture py-20 sm:py-28">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
          <Reveal>
            <SectionHeading light eyebrow="Giới thiệu chương trình" title={settings.introTitle} />
            <div className="prose-museum mt-8 text-lg leading-relaxed text-ink/80 sm:text-xl">
              {settings.introBody.split(/\n{2,}/).map((p, i) => (
                <p key={i} className="whitespace-pre-line">{p}</p>
              ))}
            </div>
          </Reveal>
          <Reveal delay={0.15}>
            <dl className="mt-12 grid grid-cols-3 gap-4 border-y border-gold-dark/30 py-8">
              <div>
                <dt className="text-sm text-ink/60">Đội dự thi</dt>
                <dd className="font-serif text-4xl font-bold text-burgundy">{products.length}</dd>
              </div>
              <div>
                <dt className="text-sm text-ink/60">Tác phẩm</dt>
                <dd className="font-serif text-4xl font-bold text-burgundy">{products.length}</dd>
              </div>
              <div>
                <dt className="text-sm text-ink/60">Mùa Giáng Sinh</dt>
                <dd className="font-serif text-4xl font-bold text-burgundy">{contest.year}</dd>
              </div>
            </dl>
          </Reveal>
        </div>
      </section>

      {/* Đếm ngược */}
      {countdown && (
        <section className="relative overflow-hidden bg-museum py-20">
          <div className="mx-auto max-w-4xl px-4 sm:px-6">
            <Reveal>
              <Countdown target={countdown.target.toISOString()} serverNow={now.toISOString()} label={countdown.label} />
              <div className="mt-10 text-center">
                <Link href="/vote" className="btn-gold text-lg">
                  {state === 'OPEN' ? 'Bình chọn ngay' : 'Hướng dẫn bình chọn'}
                </Link>
              </div>
            </Reveal>
          </div>
        </section>
      )}

      {/* Video giới thiệu */}
      {introVideoId && (
        <section className="bg-ink py-20">
          <div className="mx-auto max-w-5xl px-4 sm:px-6">
            <Reveal>
              <SectionHeading eyebrow="Video" title="Hành trình dựng hang đá" />
              <div className="frame-gold mt-12">
                <div className="frame-inner">
                  <YouTubeFacade videoId={introVideoId} title="Video giới thiệu chương trình" />
                </div>
              </div>
            </Reveal>
          </div>
        </section>
      )}

      {/* Sản phẩm nổi bật */}
      {featured.length > 0 && (
        <section className="bg-museum py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <Reveal>
              <SectionHeading eyebrow="Phòng trưng bày chính" title="Tác phẩm nổi bật" />
            </Reveal>
            <div className="mt-14 grid gap-x-8 gap-y-14 md:grid-cols-3">
              {featured.map((p, i) => (
                <Reveal key={p.id} delay={i * 0.12}>
                  <ProductCard product={p} large />
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Danh sách sản phẩm */}
      <section className="bg-ink py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <Reveal>
            <SectionHeading
              eyebrow="Triển lãm trực tuyến"
              title="Các hang đá dự thi"
              description="Mỗi hang đá là một lời kinh của các em thiếu nhi dâng lên Chúa Hài Đồng."
            />
          </Reveal>
          <div className="mt-14 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
            {products.map((p, i) => (
              <Reveal key={p.id} delay={(i % 4) * 0.08}>
                <ProductCard product={p} />
              </Reveal>
            ))}
          </div>
          <div className="mt-14 text-center">
            <Link href="/trien-lam" className="btn-outline-gold text-lg">
              Tham quan toàn bộ triển lãm →
            </Link>
          </div>
        </div>
      </section>

      {/* Bảng xếp hạng */}
      {results && (
        <section className="bg-museum py-20 sm:py-28">
          <div className="mx-auto max-w-3xl px-4 sm:px-6">
            <Reveal>
              <SectionHeading eyebrow="Bình chọn" title="Bảng xếp hạng" />
            </Reveal>
            <div className="mt-12">
              <ResultsBoard initial={results} realtime={contest.resultsRealtime} topN={5} compact />
            </div>
            <div className="mt-10 text-center">
              <Link href="/ket-qua" className="btn-outline-gold">Xem kết quả chi tiết →</Link>
            </div>
          </div>
        </section>
      )}

      {/* Tin tức */}
      {news.length > 0 && (
        <section className="bg-parchment-texture py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <Reveal>
              <SectionHeading light eyebrow="Tin tức" title="Tin từ Ban tổ chức" />
            </Reveal>
            <div className="mt-14 grid gap-8 md:grid-cols-3">
              {news.map((n, i) => (
                <Reveal key={n.id} delay={i * 0.1}>
                  <Link href={`/tin-tuc/${n.slug}`} className="group block overflow-hidden rounded-xl bg-white shadow-lg ring-1 ring-gold-dark/20">
                    <Picture imageKey={n.coverKey} alt={n.title} sizes="(min-width: 768px) 33vw, 100vw" className="aspect-[16/9] w-full" />
                    <div className="p-6">
                      <p className="text-sm text-burgundy">{formatDate(n.publishedAt)}</p>
                      <h3 className="mt-2 font-serif text-xl font-semibold text-ink group-hover:text-burgundy">{n.title}</h3>
                      {n.excerpt && <p className="mt-2 line-clamp-3 text-ink/70">{n.excerpt}</p>}
                    </div>
                  </Link>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Nhà tài trợ */}
      {sponsors.length > 0 && (
        <section className="bg-ink py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <p className="text-center text-sm font-semibold tracking-[0.3em] text-gold uppercase">Với sự đồng hành của</p>
            <Ornament className="mt-4" />
            <div className="mt-10 flex flex-wrap items-center justify-center gap-x-10 gap-y-8">
              {sponsors.map((s) => {
                const logo = s.logoKey ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={mediaUrl(s.logoKey, 400)} alt={s.name} loading="lazy" className="h-14 w-auto max-w-[160px] object-contain opacity-85 transition hover:opacity-100 sm:h-16" />
                ) : (
                  <span className="font-serif text-xl text-ivory/80">{s.name}</span>
                );
                return (
                  <div key={s.id} className="text-center">
                    {s.url ? (
                      <a href={s.url} target="_blank" rel="noopener noreferrer sponsored" title={s.name}>
                        {logo}
                      </a>
                    ) : (
                      logo
                    )}
                    {s.tier && <p className="mt-2 text-xs text-gold/80">{s.tier}</p>}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}
    </>
  );
}

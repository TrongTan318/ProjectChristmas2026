import Link from 'next/link';
import { getVotingState } from '@/domain/voting';
import { HangingOrnaments, PaperSnowflake, SnowDrift, Snowman, StringLights } from '@/components/site/ChristmasDecor';
import { Countdown } from '@/components/site/Countdown';
import { CountUp } from '@/components/site/CountUp';
import { Ornament, SectionHeading } from '@/components/site/Decor';
import { Hero, type HeroSlide } from '@/components/site/Hero';
import { Picture } from '@/components/site/Picture';
import { ProductCard } from '@/components/site/ProductCard';
import { ResultsBoard } from '@/components/site/ResultsBoard';
import { Reveal } from '@/components/site/Reveal';
import { YouTubeFacade } from '@/components/site/YouTubeFacade';
import { dateParts, formatDate } from '@/lib/format';
import { mediaUrl, parseYoutubeId } from '@/lib/media';
import { getSiteSettings, requireActiveContest } from '@/server/contest';
import { listAnnouncements, listBanners, listFeatured, listProducts, listSponsors } from '@/server/services/content';
import { getResults } from '@/server/services/results';

export default async function HomePage() {
  const contest = await requireActiveContest();
  const [settings, banners, products, featured, news, sponsors, results] = await Promise.all([
    getSiteSettings(contest.id),
    listBanners(contest.id),
    listProducts(contest.id),
    listFeatured(contest.id),
    listAnnouncements(contest.id, 3),
    listSponsors(contest.id),
    getResults(contest.id),
  ]);
  const featuredIds = new Set(featured.map((p) => p.id));

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

  const introVideoId = settings.introVideoUrl ? parseYoutubeId(settings.introVideoUrl) : null;

  return (
    <>
      <Hero slides={slides} organizer={contest.organizer} backgroundKey={settings.heroImageKey || null} />

      {/* Giới thiệu: chữ lớn cho vừa 1 màn hình PC; dây đèn, trái châu, số đếm chạy cho đỡ trống */}
      <section className="snap-page relative overflow-hidden bg-parchment-texture pt-28 sm:pt-36">
        <StringLights className="top-16" />
        <HangingOrnaments side="left" />
        <HangingOrnaments side="right" />
        <div className="relative mx-auto w-full max-w-6xl px-4 text-center sm:px-6">
          <Reveal>
            <p className="text-xs font-semibold tracking-[0.35em] text-burgundy uppercase sm:text-base sm:tracking-[0.4em]">Giới thiệu chương trình</p>
            <h2 className="motion-keep text-gold-sweep mt-3 font-serif text-[2.6rem] leading-[1.15] font-bold text-balance sm:mt-4 sm:text-7xl lg:text-8xl xl:text-[100px]">
              {settings.introTitle}
            </h2>
            <Ornament className="mt-3 sm:mt-5" />
            <div className="prose-museum mx-auto mt-5 max-w-5xl text-lg leading-relaxed text-ink/80 sm:mt-8 sm:text-2xl lg:text-[1.75rem] lg:leading-[1.6]">
              {settings.introBody.split(/\n{2,}/).map((p, i) => (
                <p key={i} className="whitespace-pre-line">{p}</p>
              ))}
            </div>
          </Reveal>
          <Reveal delay={0.15}>
            <dl className="mx-auto mt-7 grid max-w-5xl grid-cols-3 gap-2 border-y border-gold-dark/30 py-5 sm:mt-12 sm:gap-4 sm:py-8 lg:py-10">
              {[
                { label: 'Đội dự thi', value: products.length },
                { label: 'Tác phẩm', value: products.length },
                { label: 'Mùa Giáng Sinh', value: contest.year },
              ].map((s) => (
                <div key={s.label}>
                  <dt className="text-[13px] whitespace-nowrap text-ink/60 sm:text-base lg:text-lg">{s.label}</dt>
                  <dd className="relative mx-auto mt-1 w-fit font-serif text-4xl font-bold text-burgundy tabular-nums sm:text-6xl lg:text-7xl">
                    <CountUp value={s.value} />
                    <svg viewBox="0 0 24 24" className="motion-keep absolute -top-1 -right-3.5 size-3 animate-twinkle text-gold sm:-right-5 sm:size-4 lg:size-5" fill="currentColor" aria-hidden>
                      <path d="M12 0l2.4 8.6L24 12l-9.6 3.4L12 24l-2.4-8.6L0 12l9.6-3.4z" />
                    </svg>
                  </dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </div>
      </section>

      {/* Đếm ngược */}
      {countdown && (
        <section className="snap-page relative overflow-hidden bg-forest">
          <div className="mx-auto w-full max-w-4xl px-4 sm:px-6">
            <Reveal>
              <Countdown target={countdown.target.toISOString()} serverNow={now.toISOString()} label={countdown.label} />
              <div className="mt-10 text-center">
                <Link href="/vote" className="btn-glass text-lg">
                  {state === 'OPEN' ? 'Bình chọn ngay' : 'Hướng dẫn bình chọn'}
                </Link>
              </div>
            </Reveal>
          </div>
        </section>
      )}

      {/* Video giới thiệu */}
      {introVideoId && (
        <section className="snap-page bg-museum">
          <div className="mx-auto w-full max-w-5xl px-4 sm:px-6">
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

      {/* Sản phẩm nổi bật: top 3 theo phiếu, ẩn khi chưa có phiếu */}
      {featured.length > 0 && (
        <section className="snap-page bg-forest">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
            <Reveal>
              <SectionHeading eyebrow="Phòng trưng bày chính" title="Tác phẩm nổi bật" />
            </Reveal>
            <div className="mt-14 grid gap-x-8 gap-y-14 md:grid-cols-3">
              {featured.map((p, i) => (
                <Reveal key={p.id} delay={i * 0.12}>
                  <ProductCard product={p} large featured />
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Danh sách sản phẩm */}
      <section className="snap-page snap-page-long bg-museum">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
          <Reveal>
            <SectionHeading
              eyebrow="Triển lãm trực tuyến"
              title="Các hang đá dự thi"
              description="Mỗi hang đá là một lời kinh của các em thiếu nhi dâng lên Chúa Hài Đồng."
            />
          </Reveal>
          <div className="mt-10 grid gap-x-6 gap-y-10 sm:mt-14 sm:grid-cols-2 sm:gap-y-12 lg:grid-cols-4">
            {products.map((p, i) => (
              <Reveal key={p.id} delay={(i % 4) * 0.08}>
                <ProductCard product={p} featured={featuredIds.has(p.id)} />
              </Reveal>
            ))}
          </div>
          <div className="mt-14 text-center">
            <Link href="/trien-lam" className="btn-glass-clear text-lg">
              Tham quan toàn bộ triển lãm →
            </Link>
          </div>
        </div>
      </section>

      {/* Bảng xếp hạng: hiện đủ tất cả đội */}
      {results.ranking.length > 0 && (
        <section className="snap-page snap-page-long bg-forest">
          <div className="mx-auto w-full max-w-3xl px-4 sm:px-6">
            <Reveal>
              <SectionHeading eyebrow="Bình chọn" title="Bảng xếp hạng" />
            </Reveal>
            <div className="mt-12">
              <ResultsBoard initial={results} compact />
            </div>
            <div className="mt-10 text-center">
              <Link href="/ket-qua" className="btn-glass-clear">Xem kết quả chi tiết →</Link>
            </div>
          </div>
        </section>
      )}

      {/* Tin tức: bảng tin ghim kiểu dễ thương cho các em — bông tuyết giấy, người tuyết, tờ lịch ngày đăng */}
      {news.length > 0 && (
        <section className="snap-page relative overflow-hidden bg-parchment-texture">
          <PaperSnowflake className="top-20 left-2 size-12 opacity-50 sm:top-24 sm:left-[4%] sm:size-24" />
          <PaperSnowflake className="top-24 right-3 size-10 opacity-40 sm:top-32 sm:right-[6%] sm:size-20" color="#c0483e" reverse />
          <PaperSnowflake className="top-1/2 left-[9%] hidden size-14 opacity-35 md:block" color="#c0483e" reverse />
          <PaperSnowflake className="right-[12%] bottom-40 hidden size-16 opacity-40 md:block" />
          <SnowDrift />
          <Snowman className="bottom-3 left-40 hidden h-36 md:absolute md:block lg:h-44" delay={0.4} />
          <Snowman className="absolute right-3 bottom-2 h-20 sm:right-[6%] sm:h-28 lg:h-36" scarf="#1f5236" />

          <div className="relative mx-auto w-full max-w-7xl px-4 sm:px-6">
            <Reveal>
              <SectionHeading light eyebrow="Tin từ Ban tổ chức" title="Bản tin Giáng Sinh" />
            </Reveal>
            {/* Điện thoại: thẻ ngang (ảnh nhỏ bên trái) để 3 tin vừa một màn hình */}
            {/* PC: flex canh giữa để 1–2 tin vẫn nằm giữa, không lệch trái */}
            <div className="mt-8 grid gap-5 sm:mt-14 md:flex md:flex-wrap md:justify-center md:gap-8">
              {news.map((n, i) => {
                const date = n.publishedAt ? dateParts(n.publishedAt) : null;
                const isNew = !!n.publishedAt && now.getTime() - n.publishedAt.getTime() < 7 * 86_400_000;
                return (
                  <Reveal key={n.id} delay={i * 0.1} className="md:w-[calc((100%-4rem)/3)]">
                    {/* Thẻ ghim hơi nghiêng như tờ thông báo trên bảng tin; rê chuột thì thẳng lại */}
                    <div
                      className={`relative transition-transform duration-300 hover:rotate-0 ${
                        ['-rotate-[1.2deg]', 'rotate-[1deg]', '-rotate-[0.6deg]'][i % 3]
                      }`}
                    >
                      <svg
                        viewBox="0 0 24 24"
                        className="absolute -top-3 left-1/2 z-10 size-7 -translate-x-1/2 text-gold drop-shadow-[0_2px_2px_rgba(0,0,0,0.35)]"
                        fill="currentColor"
                        aria-hidden
                      >
                        <path d="M12 0l2.4 8.6L24 12l-9.6 3.4L12 24l-2.4-8.6L0 12l9.6-3.4z" />
                      </svg>
                      <Link
                        href={`/tin-tuc/${n.slug}`}
                        className="group flex overflow-hidden rounded-xl bg-white shadow-lg ring-1 ring-gold-dark/20 md:block"
                      >
                        <div className="relative shrink-0">
                          <Picture
                            imageKey={n.coverKey}
                            alt={n.title}
                            sizes="(min-width: 768px) 33vw, 128px"
                            className="aspect-square w-28 sm:w-40 md:aspect-[16/9] md:w-full"
                          />
                          {date && (
                            <time
                              dateTime={n.publishedAt!.toISOString()}
                              title={formatDate(n.publishedAt)}
                              className="absolute top-2 left-2 w-10 overflow-hidden rounded-md bg-white text-center shadow-md ring-1 ring-black/5 md:top-3 md:left-3 md:w-14"
                            >
                              <span className="block bg-[#a3241b] py-0.5 text-[9px] font-bold tracking-wide text-white uppercase md:text-[11px]">
                                Th{date.month}
                              </span>
                              <span className="block font-serif text-lg leading-tight font-bold text-ink md:text-2xl">{date.day}</span>
                            </time>
                          )}
                        </div>
                        <div className="relative min-w-0 flex-1 p-4 md:p-6">
                          {isNew && (
                            <span className="absolute top-2 right-2 rotate-6 rounded-full bg-[#a3241b] px-2 py-0.5 text-[10px] font-bold tracking-wider text-white shadow md:top-3 md:right-3 md:text-xs">
                              MỚI
                            </span>
                          )}
                          <h3 className="line-clamp-2 pr-10 font-serif text-lg leading-snug font-semibold text-ink group-hover:text-burgundy md:line-clamp-none md:text-xl">
                            {n.title}
                          </h3>
                          {n.excerpt && <p className="mt-1 line-clamp-2 text-sm text-ink/70 md:mt-2 md:line-clamp-3 md:text-base">{n.excerpt}</p>}
                          <p className="mt-3 hidden text-sm font-semibold text-burgundy md:block">Đọc tiếp →</p>
                        </div>
                      </Link>
                    </div>
                  </Reveal>
                );
              })}
            </div>
            <div className="surface-light mt-8 text-center sm:mt-12">
              <Link href="/tin-tuc" className="btn-glass-clear">
                Xem tất cả tin tức →
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Nhà tài trợ: phần thấp, không chiếm trọn màn hình — nằm chung "trang cuối" với footer */}
      {sponsors.length > 0 && (
        <section className="snap-start bg-museum pt-24 pb-14 sm:pb-16">
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

'use client';

import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { pickSlots, type DetailRow } from '@/domain/personal-item';
import { cn } from '@/lib/format';
import { mediaUrl } from '@/lib/media';
import { PhotoLightbox, type GalleryImage } from '../PhotoLightbox';
import { Picture } from '../Picture';

export interface ShowcaseImage extends GalleryImage {
  isMain: boolean;
  sortOrder: number;
}

export interface ShowcaseItem {
  id: string;
  name: string;
  maker: string;
  meaning: string;
  details: DetailRow[];
  images: ShowcaseImage[];
}

const pad = (n: number) => String(n).padStart(2, '0');
/** Ảnh nền vốn hiện mờ → dùng bản 800px (nhẹ hơn ~3 lần bản 1600px), tải trước được. */
const BACKDROP_SIZE = 800;
/** Băng thẻ dừng bao lâu thì coi như đã dừng hẳn (vuốt tay). */
const SETTLE_MS = 140;

/** Ảnh nền khung trên/dưới của một vật phẩm (thiếu ảnh thì dùng ảnh đại diện). */
function backdrops(item: ShowcaseItem) {
  const s = pickSlots(item.images);
  return { top: s.top ?? s.main, bottom: s.bottom ?? s.main };
}

/** Tên lớn kiểu poster: các chữ đầu vàng, chữ cuối trắng; tối đa 2 dòng. */
function PosterTitle({ text, className }: { text: string; className?: string }) {
  const words = text.trim().split(/\s+/);
  const last = words.length > 1 ? words.pop() : null;
  return (
    <h2 className={cn('line-clamp-2 font-sans font-black tracking-tight uppercase drop-shadow-[0_2px_10px_rgb(0_0_0/0.7)]', className)}>
      <span className="text-gold-gradient">{words.join(' ')}</span>
      {last && <span className="text-ivory"> {last}</span>}
    </h2>
  );
}

/**
 * Ảnh nền mờ: ảnh mới hiện mờ dần đè lên ảnh cũ rồi mới bỏ ảnh cũ → không chớp khi đổi vật phẩm.
 */
function CrossfadeBackdrop({ image, from }: { image: ShowcaseImage | null; from: 'top' | 'bottom' }) {
  const key = image?.key ?? null;
  const [layers, setLayers] = useState<{ key: string; blur: string }[]>(() => (image ? [{ key: image.key, blur: image.blurDataUrl }] : []));

  useEffect(() => {
    if (!image) return;
    setLayers((prev) => (prev[prev.length - 1]?.key === image.key ? prev : [...prev.slice(-1), { key: image.key, blur: image.blurDataUrl }]));
    const t = window.setTimeout(() => setLayers((prev) => prev.slice(-1)), 700);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return (
    <div className="absolute inset-0 -z-10" aria-hidden>
      {layers.map((l, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={l.key}
          src={mediaUrl(l.key, BACKDROP_SIZE)}
          alt=""
          decoding="async"
          className={cn('absolute inset-0 h-full w-full object-cover opacity-50', i === layers.length - 1 && layers.length > 1 && 'showcase-fade')}
          style={{ backgroundImage: `url(${l.blur})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
        />
      ))}
      <div className="absolute inset-0 bg-gradient-to-r from-ink/85 via-ink/45 to-ink/25" />
      <div className={cn('absolute inset-x-0 h-2/3 to-transparent', from === 'top' ? 'bottom-0 bg-gradient-to-t from-ink' : 'top-0 bg-gradient-to-b from-ink')} />
    </div>
  );
}

/** Khung trên — chỉ vẽ lại khi đổi vật phẩm (không vẽ lại trong lúc băng thẻ đang trượt). */
const TopPanel = memo(function TopPanel({ item, index, total }: { item: ShowcaseItem; index: number; total: number }) {
  return (
    <div className="relative isolate shrink-0 overflow-hidden">
      <CrossfadeBackdrop image={backdrops(item).top} from="top" />
      <div key={item.id} className="showcase-in mx-auto flex w-full max-w-6xl items-end justify-between gap-6 px-4 pt-5 pb-4 sm:px-6 lg:pt-10 lg:pb-8">
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-2 text-[11px] font-bold tracking-[0.25em] text-gold uppercase sm:text-xs">
            <span className="h-px w-6 bg-gold sm:w-10" aria-hidden />
            {pad(index + 1)} / {pad(total)} · Vật phẩm cá nhân
          </p>
          <PosterTitle text={item.name} className="mt-2 text-[clamp(1.75rem,8vw,2.6rem)] leading-[1] sm:text-5xl lg:text-6xl" />
          {item.maker && (
            <p className="mt-2 truncate text-sm text-ivory/90 drop-shadow sm:text-base">
              Người làm: <strong className="text-ivory">{item.maker}</strong>
            </p>
          )}
        </div>
        {/* Laptop: khung viền vàng 2 dòng thông tin đầu, nằm trên ảnh */}
        {item.details.length > 0 && (
          <dl className="hidden w-60 shrink-0 space-y-2 border-2 border-gold/90 bg-ink/55 p-4 lg:block">
            {item.details.slice(0, 2).map((r, i) => (
              <div key={i}>
                {r.label && <dt className="text-[11px] font-bold tracking-[0.2em] text-gold uppercase">{r.label}</dt>}
                <dd className="line-clamp-2 text-sm font-semibold text-ivory">{r.value}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    </div>
  );
});

/** Khung dưới — chỉ vẽ lại khi đổi vật phẩm. */
const BottomPanel = memo(function BottomPanel({ item, onMore }: { item: ShowcaseItem; onMore: () => void }) {
  return (
    <div className="relative isolate shrink-0 overflow-hidden">
      <CrossfadeBackdrop image={backdrops(item).bottom} from="bottom" />
      <div
        key={item.id}
        className="showcase-in-late mx-auto grid w-full max-w-6xl gap-2 px-4 pt-4 pb-[max(0.85rem,env(safe-area-inset-bottom))] sm:px-6 lg:grid-cols-[1.5fr_1fr] lg:items-end lg:gap-6 lg:pt-8 lg:pb-8"
      >
        {item.meaning ? (
          <button type="button" onClick={onMore} className="border-l-[3px] border-gold bg-ink/50 px-3 py-2 text-left lg:border-2 lg:px-5 lg:py-4">
            <span className="text-[11px] font-bold tracking-[0.25em] text-gold uppercase">Ý nghĩa</span>
            <span className="mt-0.5 line-clamp-3 block text-[15px] leading-snug text-ivory drop-shadow [@media(max-height:660px)]:line-clamp-2 lg:line-clamp-4 lg:text-base">
              {item.meaning}
            </span>
            <span className="mt-0.5 block text-xs font-bold text-gold-light">Xem thêm ›</span>
          </button>
        ) : (
          <span className="hidden lg:block" />
        )}
        {item.details.length > 0 && (
          // Điện thoại: chừa góc trái cho nút nhạc nền nổi.
          <ul className="no-scrollbar flex gap-1.5 overflow-x-auto pl-14 lg:flex-wrap lg:justify-end lg:overflow-visible lg:pl-0">
            {item.details.map((r, i) => (
              <li key={i} className="max-w-[16rem] shrink-0 truncate bg-gold px-2.5 py-1 text-[13px] text-ink">
                {r.label && <strong className="font-bold">{r.label}: </strong>}
                {r.value}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
});

/**
 * Trang trưng bày vật phẩm cá nhân — cả 3 khung trong 1 màn hình (100svh), ưu tiên điện thoại.
 * Mỗi vật phẩm 3 ảnh: ảnh đại diện (thẻ khung giữa, lướt trái/phải), ảnh khung trên và ảnh khung dưới
 * (hiện mờ làm nền, chữ đặt lên trên). "Xem thêm" mở lớp phủ đủ ý nghĩa + thông tin thêm.
 *
 * Hiệu năng: `focus` (thẻ đang ở giữa, chỉ đổi kiểu thẻ) tách khỏi `active` (nội dung khung trên/dưới).
 * Bấm mũi tên/thẻ → đổi `active` ngay 1 lần sang đích; vuốt tay → chỉ đổi khi băng dừng hẳn.
 */
export function PersonalShowcase({ items }: { items: ShowcaseItem[] }) {
  const [active, setActive] = useState(0);
  const [focus, setFocus] = useState(0);
  const [lightbox, setLightbox] = useState(-1);
  const [sheet, setSheet] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const drag = useRef<{ x: number; left: number; moved: boolean } | null>(null);
  const sheetTouch = useRef<number | null>(null);
  /** Đích đang trượt tới khi bấm mũi tên/thẻ: bỏ qua các thẻ đi ngang qua. */
  const target = useRef<number | null>(null);
  const settleTimer = useRef<number | undefined>(undefined);
  const frame = useRef(0);

  const item = items[active] ?? items[0]!;
  const slots = pickSlots(item.images);
  const gallery = [slots.main, slots.top, slots.bottom].filter((i): i is ShowcaseImage => !!i);
  const openMore = useCallback(() => setSheet(true), []);

  const nearest = useCallback(() => {
    const track = trackRef.current;
    if (!track) return 0;
    const center = track.scrollLeft + track.clientWidth / 2;
    let best = 0;
    let bestDist = Infinity;
    cardRefs.current.forEach((card, i) => {
      if (!card) return;
      const dist = Math.abs(card.offsetLeft + card.clientWidth / 2 - center);
      if (dist < bestDist) {
        bestDist = dist;
        best = i;
      }
    });
    return best;
  }, []);

  const scrollToIndex = useCallback((i: number, smooth = true) => {
    const card = cardRefs.current[i];
    const track = trackRef.current;
    if (!card || !track) return;
    track.scrollTo({ left: card.offsetLeft - (track.clientWidth - card.clientWidth) / 2, behavior: smooth ? 'smooth' : 'auto' });
  }, []);

  /** Chuyển tới vật phẩm i: đổi nội dung ngay 1 lần, rồi cho băng trượt tới. */
  const goTo = useCallback(
    (i: number, smooth = true) => {
      const next = Math.min(items.length - 1, Math.max(0, i));
      target.current = next;
      setFocus(next);
      setActive(next);
      scrollToIndex(next, smooth);
    },
    [items.length, scrollToIndex],
  );

  const onScroll = useCallback(() => {
    // Kiểu thẻ (phóng to/sáng) theo tâm băng, tối đa 1 lần mỗi khung hình; khung trên/dưới không vẽ lại.
    if (!frame.current) {
      frame.current = requestAnimationFrame(() => {
        frame.current = 0;
        if (target.current === null) setFocus(nearest());
      });
    }
    window.clearTimeout(settleTimer.current);
    settleTimer.current = window.setTimeout(() => {
      const n = nearest();
      target.current = null;
      setFocus(n);
      setActive(n);
    }, SETTLE_MS);
  }, [nearest]);

  // Thẻ cao theo chiều cao còn lại của màn hình → chừa lề hai đầu để thẻ đầu/cuối nằm được ở giữa.
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const fit = () => {
      const card = cardRefs.current[0];
      if (!card) return;
      track.style.paddingInline = `${Math.max(16, (track.clientWidth - card.clientWidth) / 2)}px`;
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(track);
    return () => {
      ro.disconnect();
      window.clearTimeout(settleTimer.current);
      cancelAnimationFrame(frame.current);
    };
  }, [items.length]);

  // Tải trước ảnh nền của vật phẩm liền trước / liền sau → chuyển là có ảnh ngay.
  useEffect(() => {
    for (const i of [active - 1, active + 1]) {
      const it = items[i];
      if (!it) continue;
      const { top, bottom } = backdrops(it);
      for (const img of [top, bottom]) if (img) new Image().src = mediaUrl(img.key, BACKDROP_SIZE);
    }
  }, [active, items]);

  // Link chia sẻ: #<id> mở đúng vật phẩm.
  useEffect(() => {
    const id = decodeURIComponent(window.location.hash.slice(1));
    const i = id ? items.findIndex((it) => it.id === id) : -1;
    if (i > 0) requestAnimationFrame(() => goTo(i, false));
  }, [items, goTo]);

  useEffect(() => {
    const id = items[active]?.id;
    if (id && window.location.hash !== `#${id}`) window.history.replaceState(null, '', `#${id}`);
  }, [active, items]);

  // Lớp phủ "Xem thêm": Esc để đóng, khóa cuộn trang phía sau.
  useEffect(() => {
    if (!sheet) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSheet(false);
    };
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [sheet]);

  const endDrag = () => {
    const track = trackRef.current;
    if (track) track.style.scrollSnapType = '';
    if (drag.current?.moved) goTo(nearest());
  };

  return (
    <section className="relative isolate flex h-[100svh] min-h-[540px] flex-col overflow-hidden bg-ink pt-16" aria-roledescription="carousel" aria-label="Vật phẩm cá nhân">
      {/* ===== KHUNG TRÊN: chữ trên ảnh khung trên (mờ) ===== */}
      <TopPanel item={item} index={active} total={items.length} />

      {/* ===== KHUNG GIỮA: băng thẻ ảnh đại diện ===== */}
      <div className="bg-forest relative min-h-0 flex-1">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_50%,rgb(212_175_55/0.2),transparent_55%)]" aria-hidden />
        <div
          ref={trackRef}
          onScroll={onScroll}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
              e.preventDefault();
              goTo(focus + (e.key === 'ArrowLeft' ? -1 : 1));
            }
          }}
          onPointerDown={(e) => {
            if (e.pointerType !== 'mouse' || !trackRef.current) return;
            drag.current = { x: e.clientX, left: trackRef.current.scrollLeft, moved: false };
          }}
          onPointerMove={(e) => {
            const d = drag.current;
            const track = trackRef.current;
            if (!d || !track) return;
            const dx = e.clientX - d.x;
            if (Math.abs(dx) > 5) d.moved = true;
            if (d.moved) {
              track.style.scrollSnapType = 'none';
              track.scrollLeft = d.left - dx;
            }
          }}
          onPointerUp={() => {
            endDrag();
            setTimeout(() => (drag.current = null), 0);
          }}
          onPointerLeave={() => {
            if (!drag.current) return;
            endDrag();
            drag.current = null;
          }}
          className="no-scrollbar relative flex h-full snap-x snap-mandatory items-center gap-1 overflow-x-auto overscroll-x-contain py-3 outline-none focus-visible:ring-2 focus-visible:ring-gold sm:gap-3"
        >
          {items.map((it, i) => {
            const main = pickSlots(it.images).main;
            const isFocus = i === focus;
            return (
              <button
                key={it.id}
                ref={(el) => {
                  cardRefs.current[i] = el;
                }}
                type="button"
                onClick={() => {
                  if (drag.current?.moved) return;
                  if (i === active && isFocus) setLightbox(0);
                  else goTo(i);
                }}
                aria-label={isFocus ? `${it.name} — xem ảnh lớn` : `Xem vật phẩm ${it.name}`}
                aria-current={isFocus ? 'true' : undefined}
                // Chỉ chuyển động transform + opacity (GPU), không dùng filter → mượt trên điện thoại.
                className={cn(
                  'relative aspect-[3/4] h-full max-h-[34rem] shrink-0 snap-center -skew-x-6 overflow-hidden border-2 transition-[transform,opacity,border-color] duration-500 ease-out will-change-transform select-none',
                  isFocus
                    ? 'z-10 scale-100 border-gold shadow-[0_24px_50px_-20px_rgb(0_0_0/0.95),0_0_36px_-10px_rgb(212_175_55/0.55)]'
                    : 'scale-[0.8] border-gold/25 opacity-70 hover:opacity-90',
                )}
              >
                <span className="absolute inset-0 -left-[10%] w-[120%] skew-x-6">
                  {main ? (
                    <Picture
                      imageKey={main.key}
                      blurDataUrl={main.blurDataUrl}
                      alt={it.name}
                      sizes="(min-width: 1024px) 400px, 60vw"
                      priority={i === 0}
                      className="pointer-events-none h-full w-full"
                    />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center bg-gradient-to-br from-burgundy to-pine text-gold/50">★</span>
                  )}
                </span>
                {/* Làm tối thẻ hai bên bằng lớp phủ (thay cho filter brightness) */}
                <span className={cn('absolute inset-0 bg-ink transition-opacity duration-500', isFocus ? 'opacity-0' : 'opacity-50')} aria-hidden />
                <span className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-ink/95 to-transparent" aria-hidden />
                <span className="absolute inset-x-0 bottom-3 skew-x-6 px-5 text-center">
                  <span className="mx-auto flex size-7 items-center justify-center rounded-full border border-gold/70 font-sans text-xs font-bold text-gold">{pad(i + 1)}</span>
                  <span className="mt-1 line-clamp-2 block font-sans text-sm leading-tight font-extrabold text-ivory uppercase sm:text-base">{it.name}</span>
                </span>
              </button>
            );
          })}
        </div>

        {items.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => goTo(focus - 1)}
              disabled={focus === 0}
              className="glass glass-clear absolute top-1/2 left-2 z-20 flex size-11 -translate-y-1/2 items-center justify-center rounded-full disabled:opacity-0 sm:left-6 sm:size-12"
              aria-label="Vật phẩm trước"
            >
              <svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor" aria-hidden><path d="M15.41 7.41 14 6l-6 6 6 6 1.41-1.41L10.83 12z" /></svg>
            </button>
            <button
              type="button"
              onClick={() => goTo(focus + 1)}
              disabled={focus === items.length - 1}
              className="glass glass-clear absolute top-1/2 right-2 z-20 flex size-11 -translate-y-1/2 items-center justify-center rounded-full disabled:opacity-0 sm:right-6 sm:size-12"
              aria-label="Vật phẩm sau"
            >
              <svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor" aria-hidden><path d="M10 6 8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" /></svg>
            </button>
          </>
        )}
        <span className="sr-only" aria-live="polite">
          Vật phẩm {active + 1} trên {items.length}: {item.name}
        </span>
      </div>

      {/* ===== KHUNG DƯỚI: chữ trên ảnh khung dưới (mờ) ===== */}
      <BottomPanel item={item} onMore={openMore} />

      {/* ===== Lớp phủ "Xem thêm": đủ ý nghĩa + thông tin thêm ===== */}
      {sheet && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-ink/75" onClick={() => setSheet(false)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-label={item.name}
            onClick={(e) => e.stopPropagation()}
            onTouchStart={(e) => (sheetTouch.current = e.currentTarget.scrollTop === 0 ? (e.touches[0]?.clientY ?? null) : null)}
            onTouchEnd={(e) => {
              const start = sheetTouch.current;
              const end = e.changedTouches[0]?.clientY;
              sheetTouch.current = null;
              if (start != null && end != null && end - start > 80) setSheet(false);
            }}
            className="showcase-in max-h-[85svh] w-full max-w-3xl overflow-y-auto rounded-t-2xl border-t-2 border-gold bg-ink-soft px-5 pt-3 pb-[max(1.5rem,env(safe-area-inset-bottom))] text-ivory sm:px-8"
          >
            <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-ivory/30" aria-hidden />
            <div className="flex items-start justify-between gap-3">
              <div>
                <PosterTitle text={item.name} className="text-3xl leading-none sm:text-4xl" />
                {item.maker && <p className="mt-2 text-ivory/85">Người làm: <strong>{item.maker}</strong></p>}
              </div>
              <button type="button" onClick={() => setSheet(false)} className="btn-glass-clear !px-4 !py-2 text-sm" aria-label="Đóng">✕</button>
            </div>
            {item.meaning && (
              <div className="mt-5 border-l-[3px] border-gold pl-4">
                <h3 className="text-xs font-bold tracking-[0.25em] text-gold uppercase">Ý nghĩa</h3>
                <div className="mt-2 space-y-3 text-lg leading-relaxed text-ivory/90">
                  {item.meaning.split(/\n{2,}/).map((p, i) => (
                    <p key={i} className="whitespace-pre-line">{p}</p>
                  ))}
                </div>
              </div>
            )}
            {item.details.length > 0 && (
              <dl className="mt-5 grid gap-3 bg-gold p-4 text-ink sm:grid-cols-2">
                {item.details.map((r, i) => (
                  <div key={i}>
                    {r.label && <dt className="text-xs font-bold tracking-[0.15em] uppercase opacity-75">{r.label}</dt>}
                    <dd className="font-semibold whitespace-pre-line">{r.value}</dd>
                  </div>
                ))}
              </dl>
            )}
          </div>
        </div>
      )}

      <PhotoLightbox images={gallery} title={item.name} index={lightbox} onClose={() => setLightbox(-1)} />
    </section>
  );
}

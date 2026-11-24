'use client';

import { useRef, useState } from 'react';
import { frameFor } from '@/domain/frame';
import { cn } from '@/lib/format';
import { PhotoLightbox, type GalleryImage } from './PhotoLightbox';
import { Picture } from './Picture';

export type { GalleryImage };

/** Mũi tên giống icon của lightbox (.yarl__icon). */
function Arrow({ dir }: { dir: 'prev' | 'next' }) {
  return (
    <svg viewBox="0 0 24 24" width="32" height="32" aria-hidden focusable="false" fill="currentColor">
      <path d={dir === 'prev' ? 'M15.41 7.41 14 6l-6 6 6 6 1.41-1.41L10.83 12z' : 'M10 6 8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z'} />
    </svg>
  );
}

const SWIPE_PX = 40;

export function Gallery({ images, title }: { images: GalleryImage[]; title: string }) {
  const [current, setCurrent] = useState(0);
  const [lightboxIndex, setLightboxIndex] = useState(-1);
  const touchX = useRef<number | null>(null);
  if (images.length === 0) return null;

  const count = images.length;
  const go = (delta: number) => setCurrent((i) => (i + delta + count) % count);
  const image = images[current]!;
  // Khung tự theo hình: ảnh lớn lấy đúng tỉ lệ (dọc/ngang); ảnh nhỏ giữ khung 4:3, hiện đủ ảnh trên nền mờ.
  const frame = frameFor(image);


  const arrowCls =
    'glass glass-clear absolute top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full';

  return (
    <div>
      <div
        className="frame-gold group mx-auto max-w-full transition-[width] duration-500 ease-out"
        // Cao tối đa ~75% màn hình: ảnh dọc thu hẹp chiều ngang và nằm giữa thay vì cao quá màn hình.
        style={{ width: `min(100%, calc(75svh * ${frame.ratio.toFixed(4)} + 20px))` }}
        onKeyDown={(e) => {
          if (e.key === 'ArrowLeft') go(-1);
          if (e.key === 'ArrowRight') go(1);
        }}
        onTouchStart={(e) => (touchX.current = e.touches[0]?.clientX ?? null)}
        onTouchEnd={(e) => {
          const start = touchX.current;
          const end = e.changedTouches[0]?.clientX;
          touchX.current = null;
          if (start == null || end == null || Math.abs(end - start) < SWIPE_PX) return;
          go(end < start ? 1 : -1);
        }}
      >
        <div className="frame-inner relative" style={{ aspectRatio: frame.ratio }}>
          <button
            type="button"
            onClick={() => setLightboxIndex(current)}
            className="block h-full w-full overflow-hidden"
            aria-label={`Xem ảnh ${current + 1} toàn màn hình`}
          >
            <Picture
              key={image.key}
              imageKey={image.key}
              blurDataUrl={image.blurDataUrl}
              alt={image.alt || title}
              sizes="(min-width: 1024px) 60vw, 100vw"
              fallbackSize={1600}
              priority={current === 0}
              fit={frame.mode === 'fit' ? 'cover' : 'contain'}
              className="h-full w-full transition-transform duration-700 group-hover:scale-[1.03]"
            />
          </button>

          {count > 1 && (
            <>
              <button type="button" onClick={() => go(-1)} className={cn(arrowCls, 'left-3')} aria-label="Ảnh trước">
                <Arrow dir="prev" />
              </button>
              <button type="button" onClick={() => go(1)} className={cn(arrowCls, 'right-3')} aria-label="Ảnh sau">
                <Arrow dir="next" />
              </button>
            </>
          )}

          <span className="pointer-events-none absolute right-3 bottom-3 inline-flex items-center gap-2 rounded-full bg-ink/80 px-3 py-1.5 text-sm text-ivory">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
            </svg>
            <span aria-live="polite">
              {current + 1} / {count}
            </span>
          </span>
        </div>
      </div>

      {count > 1 && (
        <div className="mt-4 grid grid-cols-5 gap-2 sm:grid-cols-6">
          {images.map((img, i) => (
            <button
              key={img.key}
              type="button"
              onClick={() => setCurrent(i)}
              className={cn(
                'relative aspect-square overflow-hidden rounded-md transition',
                i === current ? 'ring-2 ring-gold' : 'opacity-70 ring-1 ring-gold/30 hover:opacity-100',
              )}
              aria-label={`Ảnh ${i + 1}`}
              aria-current={i === current}
            >
              <Picture
                imageKey={img.key}
                blurDataUrl={img.blurDataUrl}
                alt=""
                sizes="120px"
                fallbackSize={400}
                className="h-full w-full"
              />
            </button>
          ))}
        </div>
      )}

      <div className="mt-4 flex justify-center">
        <button type="button" className="btn-glass-clear text-sm" onClick={() => setLightboxIndex(current)}>
          ▶ Xem trình chiếu
        </button>
      </div>

      <PhotoLightbox images={images} title={title} index={lightboxIndex} onClose={() => setLightboxIndex(-1)} onView={setCurrent} />
    </div>
  );
}

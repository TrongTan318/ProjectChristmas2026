'use client';

import { tileRatio } from '@/domain/frame';
import type { GalleryImage } from '../PhotoLightbox';
import { Tile, ViewAll } from './shared';

const SLOTS = 5;
/** Góc nghiêng và lệch dọc của từng tấm, lặp lại theo thứ tự. */
const TILT = ['-rotate-[5deg]', 'rotate-[3deg] translate-y-3', '-rotate-[2deg] -translate-y-2', 'rotate-[4deg] translate-y-2', '-rotate-[3deg]'];

/** Cành thông + quả châu trang trí góc khung (vẽ bằng SVG, không dùng ảnh ngoài). */
function PineSprig({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 80" className={className} aria-hidden>
      <path d="M6 70 C40 50 70 36 114 10" stroke="#5b3a1e" strokeWidth="3" fill="none" strokeLinecap="round" />
      {Array.from({ length: 9 }, (_, i) => {
        const x = 14 + i * 11;
        const y = 64 - i * 6.2;
        return (
          <g key={i} stroke="#1f5a35" strokeWidth="2.4" strokeLinecap="round">
            <path d={`M${x} ${y} l-6 -12`} />
            <path d={`M${x} ${y} l10 -6`} />
            <path d={`M${x} ${y} l2 10`} stroke="#2f7a4a" />
          </g>
        );
      })}
      <circle cx="34" cy="70" r="7" fill="#9b1b1b" />
      <circle cx="31.5" cy="67.5" r="2" fill="#fff" opacity="0.55" />
      <circle cx="52" cy="62" r="5" fill="#d4af37" />
    </svg>
  );
}

/** Polaroid rải: ảnh viền trắng xoay nghiêng, chồng nhẹ lên nhau trên nền giấy ngà. Mỗi tấm giữ đúng tỉ lệ ảnh. */
export function PolaroidLayout({ images, title, onOpen }: { images: GalleryImage[]; title: string; onOpen: (index: number) => void }) {
  const shown = images.slice(0, SLOTS);
  return (
    <div>
      <div className="relative overflow-hidden rounded-xl bg-[#ece3d0] bg-[radial-gradient(circle_at_20%_20%,rgb(255_255_255/0.55),transparent_55%),radial-gradient(circle_at_80%_90%,rgb(120_90_50/0.18),transparent_60%)] px-3 py-10 sm:px-8 sm:py-14">
        <PineSprig className="pointer-events-none absolute -top-1 -left-2 w-28 -scale-y-100 sm:w-40" />
        <PineSprig className="pointer-events-none absolute -right-2 -bottom-1 w-28 -scale-x-100 sm:w-40" />
        <div className="relative flex flex-wrap items-center justify-center gap-x-2 gap-y-6 sm:gap-x-0">
          {shown.map((img, i) => (
            <div
              key={img.key}
              className={`${TILT[i % TILT.length]} relative w-[46%] bg-white p-2 pb-7 shadow-[0_14px_28px_-10px_rgb(0_0_0/0.55)] transition-transform duration-300 hover:z-10 hover:scale-[1.04] hover:rotate-0 sm:-mx-3 sm:w-[34%] sm:p-3 sm:pb-10`}
            >
              <Tile
                image={img}
                index={i}
                title={title}
                onOpen={onOpen}
                sizes="(min-width: 640px) 300px, 46vw"
                className="w-full"
                style={{ aspectRatio: tileRatio(img) }}
              />
            </div>
          ))}
        </div>
      </div>
      <ViewAll total={images.length} shown={shown.length} onOpen={() => onOpen(0)} />
    </div>
  );
}

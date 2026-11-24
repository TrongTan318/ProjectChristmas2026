'use client';

import type { GalleryImage } from '../PhotoLightbox';
import { Tile, ViewAll } from './shared';

/**
 * Vị trí 5 ô: ảnh 1 hình thoi ở giữa, ảnh 2–5 là 4 tam giác ở góc (trên trái → trên phải → dưới trái → dưới phải).
 * Mỗi tam giác nằm trong 1/4 khung của nó nên ảnh được canh giữa đúng phần nhìn thấy.
 * Khe trắng giữa các ô tạo bằng cách thu nhỏ đa giác (nền khung màu ngà).
 */
const SLOTS: { box: string; clip: string }[] = [
  { box: 'inset-0', clip: 'polygon(50% 2.5%, 97.5% 50%, 50% 97.5%, 2.5% 50%)' },
  { box: 'top-0 left-0 h-1/2 w-1/2', clip: 'polygon(0 0, 93% 0, 0 93%)' },
  { box: 'top-0 right-0 h-1/2 w-1/2', clip: 'polygon(7% 0, 100% 0, 100% 93%)' },
  { box: 'bottom-0 left-0 h-1/2 w-1/2', clip: 'polygon(0 7%, 93% 100%, 0 100%)' },
  { box: 'bottom-0 right-0 h-1/2 w-1/2', clip: 'polygon(100% 7%, 100% 100%, 7% 100%)' },
];

/** Kim cương: ghép 5 ảnh theo hình học (ảnh bị cắt cho vừa ô; bấm để xem ảnh đầy đủ). */
export function DiamondLayout({ images, title, onOpen }: { images: GalleryImage[]; title: string; onOpen: (index: number) => void }) {
  const shown = images.slice(0, SLOTS.length);
  return (
    <div>
      <div className="relative mx-auto aspect-[4/5] w-full max-w-2xl overflow-hidden rounded-xl bg-ivory shadow-[0_18px_40px_-20px_rgb(0_0_0/0.9)] sm:aspect-[5/4]">
        {SLOTS.map((slot, i) => {
          const img = shown[i];
          return (
            <div key={i} className={`absolute ${slot.box}`} style={{ clipPath: slot.clip }}>
              {img ? (
                <Tile
                  image={img}
                  index={i}
                  title={title}
                  onOpen={onOpen}
                  sizes={i === 0 ? '(min-width: 672px) 672px, 100vw' : '(min-width: 672px) 336px, 50vw'}
                  className="h-full w-full"
                />
              ) : (
                // Thiếu ảnh: ô trang trí vàng-đỏ thay vì để trống.
                <div className="h-full w-full bg-gradient-to-br from-burgundy via-burgundy-light to-pine" aria-hidden />
              )}
            </div>
          );
        })}
      </div>
      <ViewAll total={images.length} shown={shown.length} onOpen={() => onOpen(0)} />
    </div>
  );
}

'use client';

import { tileRatio } from '@/domain/frame';
import type { GalleryImage } from '../PhotoLightbox';
import { Tile, ViewAll } from './shared';

/**
 * Tranh bảo tàng: mọi ảnh trong khung vàng cùng chiều cao, treo thành hàng trên tường tối có đèn rọi.
 * Chiều ngang khung theo đúng tỉ lệ ảnh (dọc hẹp, ngang rộng), không cắt.
 */
export function MuseumLayout({ images, title, onOpen }: { images: GalleryImage[]; title: string; onOpen: (index: number) => void }) {
  return (
    <div>
      <div className="rounded-xl bg-[radial-gradient(ellipse_at_top,rgb(212_175_55/0.16),transparent_60%),linear-gradient(#1c1311,#120c0b)] px-3 py-8 sm:px-6 sm:py-10">
        <div className="flex flex-wrap items-end justify-center gap-x-4 gap-y-8 sm:gap-x-7">
          {images.map((img, i) => {
            const ratio = tileRatio(img);
            return (
              <figure key={img.key} className="flex max-w-full flex-col items-center">
                <div className="frame-gold max-w-full">
                  <div className="frame-inner h-36 max-w-full sm:h-56" style={{ aspectRatio: ratio }}>
                    <Tile image={img} index={i} title={title} onOpen={onOpen} sizes="(min-width: 640px) 320px, 50vw" className="h-full w-full" />
                  </div>
                </div>
                <figcaption className="mt-2 rounded-sm bg-ivory/90 px-2 py-0.5 text-xs font-semibold tracking-wider text-ink tabular-nums">
                  № {i + 1}
                </figcaption>
              </figure>
            );
          })}
        </div>
      </div>
      <ViewAll total={images.length} shown={images.length} onOpen={() => onOpen(0)} />
    </div>
  );
}

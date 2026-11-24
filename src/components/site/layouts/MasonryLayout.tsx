'use client';

import { tileRatio } from '@/domain/frame';
import type { GalleryImage } from '../PhotoLightbox';
import { Tile, ViewAll } from './shared';

/** Lưới so le: mọi ảnh xếp theo cột, giữ nguyên tỉ lệ (không cắt) — hợp ảnh dọc chụp điện thoại. */
export function MasonryLayout({ images, title, onOpen }: { images: GalleryImage[]; title: string; onOpen: (index: number) => void }) {
  return (
    <div>
      <div className="columns-2 gap-3 sm:columns-3">
        {images.map((img, i) => (
          <Tile
            key={img.key}
            image={img}
            index={i}
            title={title}
            onOpen={onOpen}
            sizes="(min-width: 640px) 300px, 50vw"
            className="mb-3 w-full break-inside-avoid rounded-lg ring-1 ring-gold/30"
            style={{ aspectRatio: tileRatio(img) }}
          />
        ))}
      </div>
      <ViewAll total={images.length} shown={images.length} onOpen={() => onOpen(0)} />
    </div>
  );
}

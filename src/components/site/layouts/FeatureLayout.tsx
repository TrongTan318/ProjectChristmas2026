'use client';

import { tileRatio } from '@/domain/frame';
import type { GalleryImage } from '../PhotoLightbox';
import { Tile, ViewAll } from './shared';

const SLOTS = 5;

/**
 * Ảnh chính + phụ: ảnh 1 lớn (giữ đúng tỉ lệ, không cắt), 4 ảnh tiếp theo là ô vuông nhỏ bên cạnh.
 * Điện thoại: ảnh chính ở trên, ảnh phụ 2 cột bên dưới.
 */
export function FeatureLayout({ images, title, onOpen }: { images: GalleryImage[]; title: string; onOpen: (index: number) => void }) {
  const [main, ...rest] = images.slice(0, SLOTS);
  if (!main) return null;
  const extra = images.length - SLOTS;
  return (
    <div>
      <div className={rest.length > 0 ? 'grid gap-3 sm:grid-cols-[3fr_2fr] sm:items-start' : ''}>
        <div className="frame-gold">
          <div className="frame-inner" style={{ aspectRatio: tileRatio(main) }}>
            <Tile image={main} index={0} title={title} onOpen={onOpen} sizes="(min-width: 640px) 520px, 100vw" className="h-full w-full" />
          </div>
        </div>
        {rest.length > 0 && (
          <div className="grid grid-cols-2 gap-3">
            {rest.map((img, i) => (
              <div key={img.key} className="relative aspect-square overflow-hidden rounded-lg ring-1 ring-gold/40">
                <Tile image={img} index={i + 1} title={title} onOpen={onOpen} sizes="(min-width: 640px) 200px, 50vw" className="h-full w-full" />
                {i === rest.length - 1 && extra > 0 && (
                  <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-ink/60 font-serif text-2xl text-ivory">
                    +{extra}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      <ViewAll total={images.length} shown={Math.min(images.length, SLOTS)} onOpen={() => onOpen(0)} />
    </div>
  );
}

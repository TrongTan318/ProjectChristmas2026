'use client';

import { cn } from '@/lib/format';
import type { GalleryImage } from '../PhotoLightbox';
import { Picture } from '../Picture';

/** Ảnh bấm được để mở xem toàn màn hình. */
export function Tile({
  image,
  index,
  title,
  onOpen,
  sizes,
  fit = 'cover',
  className,
  imgClassName,
  style,
}: {
  image: GalleryImage;
  index: number;
  title: string;
  onOpen: (index: number) => void;
  sizes: string;
  fit?: 'cover' | 'contain';
  className?: string;
  imgClassName?: string;
  style?: React.CSSProperties;
}) {
  return (
    <button
      type="button"
      onClick={() => onOpen(index)}
      className={cn('group/tile block overflow-hidden focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold', className)}
      style={style}
      aria-label={`Xem ảnh ${index + 1} toàn màn hình`}
    >
      <Picture
        imageKey={image.key}
        blurDataUrl={image.blurDataUrl}
        alt={image.alt || title}
        sizes={sizes}
        fit={fit}
        className={cn('h-full w-full transition-transform duration-700 group-hover/tile:scale-[1.04]', imgClassName)}
      />
    </button>
  );
}

/** Nút dưới khung: xem tất cả (khi khung chỉ hiện một phần ảnh) / trình chiếu. */
export function ViewAll({ total, shown, onOpen }: { total: number; shown: number; onOpen: () => void }) {
  return (
    <div className="mt-5 flex justify-center">
      <button type="button" className="btn-glass-clear text-sm" onClick={onOpen}>
        {total > shown ? `Xem tất cả ${total} ảnh` : '▶ Xem trình chiếu'}
      </button>
    </div>
  );
}

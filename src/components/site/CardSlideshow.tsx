'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/format';
import { Picture } from './Picture';

interface SlideImage {
  key: string;
  blurDataUrl: string;
  alt: string;
}

/**
 * Ảnh thẻ sản phẩm tự chuyển sau mỗi `interval` ms (mờ dần).
 * Chỉ chạy khi thẻ đang hiển thị trên màn hình và tab đang mở; tắt khi người dùng giảm chuyển động.
 * Ảnh kế tiếp được gắn trước một bước để kịp tải, các ảnh còn lại chưa tải.
 */
export function CardSlideshow({
  images,
  alt,
  sizes,
  priority,
  interval = 5000,
  className,
}: {
  images: SlideImage[];
  alt: string;
  sizes: string;
  priority?: boolean;
  interval?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [mounted, setMounted] = useState(1);
  const count = images.length;

  useEffect(() => {
    const el = ref.current;
    if (count < 2 || !el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let visible = false;
    const observer = new IntersectionObserver(([entry]) => {
      visible = !!entry?.isIntersecting;
      if (visible) setMounted((m) => Math.max(m, 2)); // tải trước ảnh thứ 2 khi thẻ xuất hiện
    });
    observer.observe(el);

    const timer = setInterval(() => {
      if (!visible || document.hidden) return;
      setIndex((i) => (i + 1) % count);
    }, interval);

    return () => {
      observer.disconnect();
      clearInterval(timer);
    };
  }, [count, interval]);

  // Gắn trước ảnh kế tiếp để khi chuyển đã tải xong.
  useEffect(() => {
    if (index > 0) setMounted((m) => Math.min(count, Math.max(m, index + 2)));
  }, [index, count]);

  if (count === 0) return <Picture imageKey={null} alt={alt} sizes={sizes} className={cn('h-full w-full', className)} />;

  return (
    <div ref={ref} className={cn('relative h-full w-full', className)}>
      {images.slice(0, mounted).map((img, i) => (
        <Picture
          key={img.key}
          imageKey={img.key}
          blurDataUrl={i === 0 ? img.blurDataUrl : undefined}
          alt={i === index ? img.alt || alt : ''}
          sizes={sizes}
          priority={priority && i === 0}
          className={cn(
            'absolute inset-0 h-full w-full transition-opacity duration-1000 ease-in-out',
            i === index ? 'opacity-100' : 'opacity-0',
          )}
        />
      ))}
      {count > 1 && (
        <div className="pointer-events-none absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5" aria-hidden>
          {images.map((img, i) => (
            <span
              key={img.key}
              className={cn('h-1.5 rounded-full transition-all duration-500', i === index ? 'w-4 bg-gold' : 'w-1.5 bg-ivory/60')}
            />
          ))}
        </div>
      )}
    </div>
  );
}

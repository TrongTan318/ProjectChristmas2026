import { mediaSrcSet, mediaUrl, type ImageSize } from '@/lib/media';
import { cn } from '@/lib/format';

/** Ảnh responsive dùng các biến thể WebP đã sinh sẵn + nền mờ (blur placeholder). */
export function Picture({
  imageKey,
  alt,
  sizes,
  blurDataUrl,
  className,
  priority,
  fallbackSize = 800,
}: {
  imageKey: string | null | undefined;
  alt: string;
  sizes: string;
  blurDataUrl?: string | null;
  className?: string;
  priority?: boolean;
  fallbackSize?: ImageSize;
}) {
  if (!imageKey) {
    return (
      <div
        className={cn(
          'flex items-center justify-center bg-gradient-to-br from-burgundy-dark via-ink-soft to-ink text-gold/40',
          className,
        )}
        role="img"
        aria-label={alt}
      >
        <svg width="56" height="56" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M12 0l2.4 8.6L24 12l-9.6 3.4L12 24l-2.4-8.6L0 12l9.6-3.4z" />
        </svg>
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={mediaUrl(imageKey, fallbackSize)}
      srcSet={mediaSrcSet(imageKey)}
      sizes={sizes}
      alt={alt}
      loading={priority ? 'eager' : 'lazy'}
      fetchPriority={priority ? 'high' : 'auto'}
      decoding="async"
      className={cn('object-cover', className)}
      style={
        blurDataUrl
          ? { backgroundImage: `url(${blurDataUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
          : undefined
      }
    />
  );
}

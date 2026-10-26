import Link from 'next/link';
import type { ProductListItem } from '@/server/services/content';
import { cn } from '@/lib/format';
import { CardSlideshow } from './CardSlideshow';
import { Picture } from './Picture';
import { ViewCount } from './ViewCount';

export function ProductCard({
  product,
  large,
  priority,
  featured,
}: {
  product: ProductListItem;
  large?: boolean;
  priority?: boolean;
  /** Thuộc top 3 theo phiếu (`listFeatured`). */
  featured?: boolean;
}) {
  const cover = product.images[0];
  return (
    <Link
      href={`/trien-lam/${product.slug}`}
      className="group block focus-visible:outline-offset-8"
      aria-label={`${product.name} — ${product.team?.className ?? ''}`}
    >
      <div className="frame-gold transition-transform duration-500 group-hover:-translate-y-1.5">
        <div className={cn('frame-inner relative', large ? 'aspect-[4/5]' : 'aspect-[4/3]')}>
          {large ? (
            <CardSlideshow
              images={product.images}
              alt={product.name}
              sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
              priority={priority}
              className="transition-transform duration-700 group-hover:scale-105"
            />
          ) : (
            <Picture
              imageKey={cover?.key}
              blurDataUrl={cover?.blurDataUrl}
              alt={cover?.alt || product.name}
              sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
              className="h-full w-full transition-transform duration-700 group-hover:scale-105"
              priority={priority}
            />
          )}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/60 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
          {featured && (
            <span className="absolute top-3 left-3 rounded-full bg-burgundy/90 px-3 py-1 text-xs font-semibold text-gold-light">
              ★ Nổi bật
            </span>
          )}
          {product._count.images > 1 && (
            <span className="absolute right-3 bottom-3 rounded-full bg-ink/75 px-2.5 py-1 text-xs text-ivory">
              {product._count.images} ảnh
            </span>
          )}
        </div>
      </div>
      <div className="museum-plaque relative mx-auto -mt-3 w-[88%] rounded-sm px-4 py-3 text-center">
        <p className="text-[11px] font-semibold tracking-[0.2em] text-burgundy uppercase">
          {product.team?.className}
          {product.team?.name ? ` · ${product.team.name}` : ''}
        </p>
        <h3 className="mt-1 font-serif text-lg leading-snug font-semibold text-ink">{product.name}</h3>
        {large && product.shortDescription && (
          <p className="mt-1.5 line-clamp-2 text-sm text-ink/70">{product.shortDescription}</p>
        )}
        <ViewCount count={product.viewCount} className="mt-1.5 text-xs text-ink/55" />
      </div>
    </Link>
  );
}

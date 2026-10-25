import { cn } from '@/lib/format';

/** Hoa văn chia mục: ngôi sao Bêlem giữa hai đường mạ vàng. */
export function Ornament({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center justify-center gap-3 text-gold', className)} aria-hidden>
      <span className="h-px w-16 bg-gradient-to-r from-transparent to-gold sm:w-24" />
      <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0l2.4 8.6L24 12l-9.6 3.4L12 24l-2.4-8.6L0 12l9.6-3.4z" />
      </svg>
      <span className="h-px w-16 bg-gradient-to-l from-transparent to-gold sm:w-24" />
    </div>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  light,
  compactOnMobile,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  light?: boolean;
  /** Ẩn mô tả và thu gọn khoảng cách trên điện thoại. */
  compactOnMobile?: boolean;
  className?: string;
}) {
  return (
    <div className={cn('mx-auto max-w-3xl text-center', className)}>
      {eyebrow && (
        <p className={cn('mb-3 text-xs font-semibold uppercase tracking-[0.3em]', light ? 'text-burgundy' : 'text-gold')}>
          {eyebrow}
        </p>
      )}
      <h2
        className={cn(
          'font-serif text-3xl leading-tight font-semibold sm:text-4xl md:text-5xl',
          light ? 'text-burgundy-dark' : 'text-gold-gradient',
        )}
      >
        {title}
      </h2>
      <Ornament className={compactOnMobile ? 'mt-3 sm:mt-5' : 'mt-5'} />
      {description && (
        <p className={cn('mt-5 text-base sm:text-lg', light ? 'text-ink/75' : 'text-ivory/75', compactOnMobile && 'hidden sm:block')}>
          {description}
        </p>
      )}
    </div>
  );
}

/** Cửa sổ hoa hồng kính màu (rose window) vẽ bằng SVG. */
export function RoseWindow({ className }: { className?: string }) {
  const petals = Array.from({ length: 12 });
  const colors = ['#8e2a3e', '#d4af37', '#1e4078', '#145a3c'];
  return (
    <svg viewBox="-100 -100 200 200" className={className} aria-hidden>
      <defs>
        <radialGradient id="rw-center" r="1">
          <stop offset="0" stopColor="#fff6d5" />
          <stop offset="0.5" stopColor="#d4af37" />
          <stop offset="1" stopColor="#6d1a2b" />
        </radialGradient>
      </defs>
      <circle r="98" fill="none" stroke="#d4af37" strokeWidth="2" opacity="0.8" />
      <circle r="90" fill="none" stroke="#d4af37" strokeWidth="0.8" opacity="0.6" />
      {petals.map((_, i) => (
        <g key={i} transform={`rotate(${i * 30})`}>
          <path
            d="M0 -22 C 14 -40, 14 -66, 0 -86 C -14 -66, -14 -40, 0 -22Z"
            fill={colors[i % 4]}
            fillOpacity="0.55"
            stroke="#d4af37"
            strokeWidth="1.2"
          />
          <circle cy="-72" r="5" fill={colors[(i + 1) % 4]} fillOpacity="0.7" stroke="#d4af37" strokeWidth="0.8" />
        </g>
      ))}
      <circle r="22" fill="url(#rw-center)" stroke="#d4af37" strokeWidth="1.5" />
      <path d="M0 -14l3.3 10.7L14 0 3.3 3.3 0 14l-3.3-10.7L-14 0l10.7-3.3z" fill="#fffdf2" />
    </svg>
  );
}

export function Candle({ className }: { className?: string }) {
  return (
    <div className={cn('relative flex w-6 flex-col items-center', className)} aria-hidden>
      <div className="candle-glow absolute -top-8 h-20 w-20" />
      <div className="relative h-5 w-2.5 animate-flicker rounded-full bg-gradient-to-t from-orange-400 via-amber-200 to-white" />
      <div className="h-16 w-4 rounded-sm bg-gradient-to-b from-ivory to-parchment shadow-[inset_-3px_0_6px_rgba(0,0,0,0.2)]" />
    </div>
  );
}

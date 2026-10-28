import { cn, formatNumber } from '@/lib/format';

/** Dòng nhỏ "👁 1.234 lượt xem". */
export function ViewCount({ count, className }: { count: number; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 tabular-nums', className)}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
      {formatNumber(count)} lượt xem
    </span>
  );
}

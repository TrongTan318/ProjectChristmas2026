import type { StageLayout } from '@/domain/stage';

/** Hình minh họa nhỏ của từng kiểu khung (để chọn trong admin). Ô đậm = ảnh. */
export function LayoutIcon({ layout, className }: { layout: StageLayout; className?: string }) {
  const photo = 'fill-burgundy/80';
  const soft = 'fill-burgundy/45';
  return (
    <svg viewBox="0 0 60 44" className={className} aria-hidden>
      <rect width="60" height="44" rx="3" className="fill-zinc-100" />
      {layout === 'slideshow' && (
        <>
          <rect x="17" y="3" width="26" height="30" rx="1" className={photo} />
          <path d="M11 18l-4 3 4 3M49 18l4 3-4 3" className="fill-none stroke-zinc-500" strokeWidth="1.5" />
          {[0, 1, 2, 3, 4].map((i) => (
            <rect key={i} x={14 + i * 7} y="36" width="5" height="5" rx="0.5" className={i === 0 ? photo : soft} />
          ))}
        </>
      )}
      {layout === 'polaroid' && (
        <>
          <rect width="60" height="44" rx="3" className="fill-amber-100" />
          {[
            [6, 6, -8],
            [22, 10, 6],
            [38, 5, -4],
            [14, 23, 5],
            [32, 24, -6],
          ].map(([x, y, r], i) => (
            <g key={i} transform={`rotate(${r} ${x! + 8} ${y! + 8})`}>
              <rect x={x} y={y} width="16" height="17" className="fill-white stroke-zinc-300" strokeWidth="0.5" />
              <rect x={x! + 1.5} y={y! + 1.5} width="13" height="11" className={photo} />
            </g>
          ))}
        </>
      )}
      {layout === 'diamond' && (
        <>
          <path d="M30 3 L56 22 L30 41 L4 22 Z" className={photo} />
          <path d="M2 2 H27 L2 19 Z M33 2 H58 V19 Z M2 25 L27 42 H2 Z M58 25 V42 H33 Z" className={soft} />
        </>
      )}
      {layout === 'masonry' && (
        <>
          {[
            [4, 4, 16, 20],
            [4, 27, 16, 13],
            [22, 4, 16, 12],
            [22, 19, 16, 21],
            [40, 4, 16, 24],
            [40, 31, 16, 9],
          ].map(([x, y, w, h], i) => (
            <rect key={i} x={x} y={y} width={w} height={h} rx="1" className={i % 2 ? soft : photo} />
          ))}
        </>
      )}
      {layout === 'feature' && (
        <>
          <rect x="4" y="4" width="28" height="36" rx="1" className={photo} />
          {[
            [35, 4],
            [47, 4],
            [35, 23],
            [47, 23],
          ].map(([x, y], i) => (
            <rect key={i} x={x} y={y} width="10" height="17" rx="1" className={soft} />
          ))}
        </>
      )}
      {layout === 'museum' && (
        <>
          <rect width="60" height="44" rx="3" className="fill-zinc-800" />
          {[
            [5, 10, 13, 24],
            [21, 14, 20, 20],
            [44, 10, 12, 24],
          ].map(([x, y, w, h], i) => (
            <g key={i}>
              <rect x={x! - 1.5} y={y! - 1.5} width={w! + 3} height={h! + 3} className="fill-amber-400" />
              <rect x={x} y={y} width={w} height={h} className={i === 1 ? soft : photo} />
            </g>
          ))}
        </>
      )}
    </svg>
  );
}

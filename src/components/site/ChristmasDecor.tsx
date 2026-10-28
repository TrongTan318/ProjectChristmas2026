import { cn } from '@/lib/format';

/*
 * Trang trí Giáng Sinh cho phần đầu trang chủ, vẽ bằng SVG + CSS animation (nhẹ, nét mọi màn hình).
 * Có class `motion-keep` để vẫn chạy khi hệ điều hành bật giảm chuyển động (giống tuyết rơi).
 */

const LIGHTS = [
  { cx: 50, cy: 34, c: '#f3dc8a' },
  { cx: 38, cy: 52, c: '#d4af37' },
  { cx: 60, cy: 58, c: '#f3dc8a' },
  { cx: 30, cy: 80, c: '#f3dc8a' },
  { cx: 52, cy: 76, c: '#d4af37' },
  { cx: 70, cy: 86, c: '#f3dc8a' },
  { cx: 24, cy: 108, c: '#d4af37' },
  { cx: 44, cy: 104, c: '#f3dc8a' },
  { cx: 64, cy: 112, c: '#d4af37' },
  { cx: 80, cy: 106, c: '#f3dc8a' },
];

/** Cây thông trắng phủ tuyết, đèn vàng nhấp nháy, ngôi sao trên đỉnh. */
export function WhiteTree({ className, delay = 0 }: { className?: string; delay?: number }) {
  return (
    <svg viewBox="0 0 100 150" className={cn('motion-keep drop-shadow-[0_6px_14px_rgba(0,0,0,0.55)]', className)} aria-hidden>
      <defs>
        <linearGradient id="tree-white" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.55" stopColor="#e6edf3" />
          <stop offset="1" stopColor="#b9c6d2" />
        </linearGradient>
      </defs>
      <rect x="44" y="128" width="12" height="18" rx="2" fill="#5b3a29" />
      {/* 3 tầng lá, mép dưới gợn như tuyết đọng */}
      <path d="M50 14 L76 56 Q70 54 66 58 Q60 54 54 58 Q50 54 46 58 Q40 54 34 58 Q30 54 24 56 Z" fill="url(#tree-white)" />
      <path d="M50 36 L84 90 Q77 87 72 92 Q65 87 58 92 Q50 87 42 92 Q35 87 28 92 Q23 87 16 90 Z" fill="url(#tree-white)" />
      <path d="M50 62 L92 128 Q84 124 78 129 Q70 124 62 129 Q50 123 38 129 Q30 124 22 129 Q16 124 8 128 Z" fill="url(#tree-white)" />
      {/* vòng kim tuyến vàng */}
      <path d="M32 66 Q50 74 68 64 M24 100 Q52 110 80 98" fill="none" stroke="#d4af37" strokeWidth="1.6" strokeOpacity="0.8" />
      {LIGHTS.map((l, i) => (
        <circle
          key={i}
          cx={l.cx}
          cy={l.cy}
          r="2.6"
          fill={l.c}
          className="animate-twinkle"
          style={{ animationDelay: `${delay + (i % 5) * 0.37}s` }}
        />
      ))}
      <path d="M50 2l2.6 6.4 6.9.5-5.3 4.4 1.7 6.7L50 16.3 44.1 20l1.7-6.7-5.3-4.4 6.9-.5z" fill="#f3dc8a" className="animate-twinkle" />
    </svg>
  );
}

/** Hộp quà nhún nhảy, nắp thỉnh thoảng bật lên. */
export function GiftBox({
  className,
  color = '#7a1e17',
  ribbon = '#d4af37',
  delay = 0,
}: {
  className?: string;
  color?: string;
  ribbon?: string;
  delay?: number;
}) {
  return (
    <div className={cn('motion-keep origin-bottom animate-gift-bounce', className)} style={{ animationDelay: `${delay}s` }} aria-hidden>
      <svg viewBox="0 0 60 64" className="h-full w-full drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)]">
        <rect x="6" y="28" width="48" height="34" rx="3" fill={color} />
        <rect x="26" y="28" width="8" height="34" fill={ribbon} />
        <g className="motion-keep animate-gift-lid [transform-box:fill-box] [transform-origin:20%_100%]" style={{ animationDelay: `${delay}s` }}>
          <rect x="2" y="18" width="56" height="12" rx="3" fill={color} />
          <rect x="2" y="18" width="56" height="12" rx="3" fill="#000" fillOpacity="0.12" />
          <rect x="26" y="18" width="8" height="12" fill={ribbon} />
          <path d="M30 18 C 20 4, 8 10, 18 17 Z M30 18 C 40 4, 52 10, 42 17 Z" fill={ribbon} />
        </g>
      </svg>
    </div>
  );
}

// Dây đèn: 16 đoạn võng nối nhau, mỗi đoạn 4 bóng. Một SVG duy nhất nên id gradient không trùng.
const BULB_COLORS = ['#e0453a', '#f3dc8a', '#3fbf6f'];
const SEGMENTS = 16;
const SEG_W = 200;
const WIRE_Y = 8;
const WIRE_CTRL_Y = 72; // điểm điều khiển Bézier → giữa đoạn võng xuống y = 40

const WIRE = Array.from(
  { length: SEGMENTS },
  (_, s) => `M${s * SEG_W} ${WIRE_Y} Q${s * SEG_W + SEG_W / 2} ${WIRE_CTRL_Y} ${(s + 1) * SEG_W} ${WIRE_Y}`,
).join(' ');

const BULBS = Array.from({ length: SEGMENTS * 4 }, (_, i) => {
  const t = 0.2 * ((i % 4) + 1);
  const y = (1 - t) ** 2 * WIRE_Y + 2 * (1 - t) * t * WIRE_CTRL_Y + t ** 2 * WIRE_Y;
  const slope = (2 * (WIRE_CTRL_Y - WIRE_Y) * (1 - 2 * t)) / SEG_W;
  return {
    x: Math.floor(i / 4) * SEG_W + t * SEG_W,
    y,
    // Bóng nghiêng theo dây một chút cho tự nhiên
    angle: ((Math.atan(slope) * 180) / Math.PI) * 0.6,
    color: i % BULB_COLORS.length,
  };
});

/** Dây đèn Noel võng ngang, bóng đỏ/vàng/xanh chớp tắt kiểu đèn đuổi. Đặt trong khối `relative`. */
export function StringLights({ className }: { className?: string }) {
  return (
    <div className={cn('motion-keep pointer-events-none absolute inset-x-0 overflow-hidden', className)} aria-hidden>
      <svg
        viewBox={`0 0 ${SEGMENTS * SEG_W} 70`}
        className="relative left-1/2 h-10 w-auto max-w-none -translate-x-1/2 sm:h-14"
      >
        <defs>
          {BULB_COLORS.map((c, i) => (
            <radialGradient key={c} id={`sl-glow-${i}`}>
              <stop offset="0" stopColor={c} stopOpacity="0.7" />
              <stop offset="1" stopColor={c} stopOpacity="0" />
            </radialGradient>
          ))}
        </defs>
        <path d={WIRE} fill="none" stroke="#113621" strokeWidth="2" />
        {BULBS.map((b, i) => (
          <g key={i} transform={`translate(${b.x} ${b.y}) rotate(${b.angle})`}>
            <rect x="-2.5" y="-1" width="5" height="6" rx="1" fill="#1f5236" />
            <g className="animate-bulb" style={{ animationDelay: `${b.color * 0.8}s` }}>
              <circle cy="13" r="15" fill={`url(#sl-glow-${b.color})`} />
              <ellipse cy="13" rx="4.5" ry="7.5" fill={BULB_COLORS[b.color]} />
              <ellipse cx="-1.5" cy="10" rx="1.2" ry="2.5" fill="#fff" fillOpacity="0.6" />
            </g>
          </g>
        ))}
      </svg>
    </div>
  );
}

interface Ornament {
  offset: string;
  length: number;
  size: number;
  color: string;
  shape: 'ball' | 'star';
  delay: number;
}

// Màn hình rộng: 3 quả, dây dài, nằm trong khoảng trống hai bên nội dung.
const ORNAMENTS_WIDE: Ornament[] = [
  { offset: '4%', length: 70, size: 52, color: '#a3241b', shape: 'ball', delay: 0 },
  { offset: '9.5%', length: 160, size: 40, color: '#d4af37', shape: 'star', delay: 0.7 },
  { offset: '14%', length: 105, size: 36, color: '#1f5236', shape: 'ball', delay: 1.4 },
];
// Điện thoại/tablet: 2 quả nhỏ, dây ngắn, treo sát góc trên để không đè lên chữ.
const ORNAMENTS_NARROW: Ornament[] = [
  { offset: '3%', length: 24, size: 30, color: '#a3241b', shape: 'ball', delay: 0 },
  { offset: '11%', length: 62, size: 22, color: '#d4af37', shape: 'star', delay: 0.7 },
];

/** Cụm trái châu treo đung đưa ở mép trái/phải; màn hẹp dùng bộ nhỏ ở góc trên. */
export function HangingOrnaments({ side }: { side: 'left' | 'right' }) {
  return (
    <>
      <OrnamentSet items={ORNAMENTS_NARROW} side={side} className="xl:hidden" />
      <OrnamentSet items={ORNAMENTS_WIDE} side={side} className="hidden xl:block" />
    </>
  );
}

function OrnamentSet({ items, side, className }: { items: Ornament[]; side: 'left' | 'right'; className: string }) {
  return (
    <div className={cn('motion-keep pointer-events-none absolute inset-0', className)} aria-hidden>
      {items.map((o, i) => (
        <div
          key={i}
          className="absolute top-20 flex origin-top animate-sway flex-col items-center"
          style={{ [side]: o.offset, animationDelay: `${side === 'left' ? o.delay : o.delay + 0.4}s` }}
        >
          <span className="w-px bg-gold-dark/70" style={{ height: o.length }} />
          {o.shape === 'ball' ? (
            <svg viewBox="0 0 40 46" style={{ width: o.size }} className="drop-shadow-[0_6px_10px_rgba(0,0,0,0.3)]">
              <rect x="15" y="0" width="10" height="7" rx="1.5" fill="#d4af37" />
              <circle cx="20" cy="26" r="18" fill={o.color} />
              <path d="M3 24 Q20 32 37 24" stroke="#f3dc8a" strokeWidth="1.6" fill="none" opacity="0.85" />
              <ellipse cx="13" cy="18" rx="3.5" ry="6" fill="#fff" fillOpacity="0.45" transform="rotate(30 13 18)" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" style={{ width: o.size }} className="animate-star-glow drop-shadow-[0_0_10px_rgba(212,175,55,0.7)]">
              <path d="M12 0l2.4 8.6L24 12l-9.6 3.4L12 24l-2.4-8.6L0 12l9.6-3.4z" fill={o.color} />
            </svg>
          )}
        </div>
      ))}
    </div>
  );
}

/** Cụm góc dưới: cây thông + hộp quà. `mirror` cho góc phải. */
export function TreeCorner({ mirror }: { mirror?: boolean }) {
  return (
    <div className={cn('flex items-end gap-1 sm:gap-2', mirror && 'flex-row-reverse')}>
      <WhiteTree className="h-24 w-auto sm:h-36 lg:h-44" delay={mirror ? 0.6 : 0} />
      <WhiteTree className="hidden h-24 w-auto sm:block lg:h-32" delay={mirror ? 0.2 : 0.9} />
      <GiftBox className="-ml-3 h-10 w-10 sm:-ml-4 sm:h-12 sm:w-12" delay={mirror ? 0.9 : 0} />
      <GiftBox
        className="-ml-1 hidden h-8 w-8 sm:block sm:h-10 sm:w-10"
        color="#1f5236"
        ribbon="#f3dc8a"
        delay={mirror ? 0.3 : 1.2}
      />
    </div>
  );
}

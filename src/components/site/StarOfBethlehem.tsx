'use client';

import { motion, useAnimate } from 'framer-motion';
import { useEffect, type RefObject } from 'react';

const STAR_PATH = 'M12 0l2.4 8.6L24 12l-9.6 3.4L12 24l-2.4-8.6L0 12l9.6-3.4z';
const TRAIL = 6;
const WANDER_POINTS = 6;

/**
 * Ngôi sao Bêlem: bay loạn xạ quanh phần đầu trang (kèm đuôi lấp lánh), rồi lao về
 * "chỗ đậu" (`targetRef`, nằm trên tiêu đề) và bừng sáng thành ngôi sao lớn ở lại đó.
 * Chạy 1 lần mỗi lần tải trang. Dùng framer-motion nên vẫn chạy khi hệ điều hành
 * bật giảm chuyển động (giống tuyết rơi, theo yêu cầu người dùng).
 */
export function StarOfBethlehem({
  areaRef,
  targetRef,
  onLanded,
}: {
  areaRef: RefObject<HTMLElement | null>;
  targetRef: RefObject<HTMLElement | null>;
  /** Gọi khi sao đã về chỗ đậu: nơi gọi hiển thị `<LandedStar />` trong chỗ đậu. */
  onLanded: () => void;
}) {
  const [scope, animate] = useAnimate();

  useEffect(() => {
    const area = areaRef.current;
    const target = targetRef.current;
    if (!area || !target || !scope.current) return;
    let cancelled = false;

    const a = area.getBoundingClientRect();
    const t = target.getBoundingClientRect();
    const tx = t.left - a.left + t.width / 2;
    const ty = t.top - a.top + t.height / 2;
    const rnd = (min: number, max: number) => min + Math.random() * (max - min);

    // Vào từ mép trái hoặc phải, bay qua vài điểm ngẫu nhiên, cuối cùng về chỗ đậu.
    const fromLeft = Math.random() < 0.5;
    const xs = [fromLeft ? -40 : a.width + 40];
    const ys = [rnd(0.1, 0.45) * a.height];
    for (let i = 0; i < WANDER_POINTS; i++) {
      xs.push(rnd(0.08, 0.92) * a.width);
      ys.push(rnd(0.1, 0.75) * a.height);
    }
    xs.push(tx);
    ys.push(ty);
    const n = xs.length;
    // Đoạn cuối (lao về giữa) chiếm 18% thời gian, các đoạn lượn chia đều phần còn lại.
    const times = xs.map((_, i) => (i === n - 1 ? 1 : (i / (n - 2)) * 0.82));
    const duration = 6.5;

    const run = async () => {
      const head = animate(
        '.star-head',
        { x: xs, y: ys, opacity: [0, ...Array(n - 2).fill(1), 1], scale: [0.8, ...Array(n - 2).fill(1), 2.2] },
        { duration, times, ease: 'easeInOut' },
      );
      for (let i = 0; i < TRAIL; i++) {
        const o = 0.55 * (1 - i / TRAIL);
        void animate(
          `.star-trail-${i}`,
          { x: xs, y: ys, opacity: [0, ...Array(n - 2).fill(o), 0] },
          { duration, times, ease: 'easeInOut', delay: (i + 1) * 0.06 },
        );
      }
      await head;
      if (cancelled) return;
      onLanded();
      void animate('.star-head', { opacity: 0, scale: 3 }, { duration: 0.35 });
    };
    void run();
    return () => {
      cancelled = true;
    };
    // Chỉ chạy 1 lần khi mở trang
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    // Ngôi sao đang bay + đuôi (định vị bằng transform trong phần đầu trang)
    <div ref={scope} className="pointer-events-none absolute inset-0 -z-[5] overflow-hidden" aria-hidden>
      {Array.from({ length: TRAIL }, (_, i) => (
        <span
          key={i}
          className={`star-trail-${i} absolute top-0 left-0 rounded-full bg-gold-light opacity-0 blur-[1px]`}
          style={{ width: 10 - i, height: 10 - i, marginLeft: -(10 - i) / 2, marginTop: -(10 - i) / 2 }}
        />
      ))}
      <span className="star-head absolute top-0 left-0 -mt-4 -ml-4 block h-8 w-8 opacity-0">
        <span className="absolute inset-[-60%] rounded-full bg-[radial-gradient(circle,rgb(255_244_200/0.9),rgb(212_175_55/0.35)_40%,transparent_70%)]" />
        <svg viewBox="0 0 24 24" className="relative h-full w-full text-[#fffbe8]" fill="currentColor">
          <path d={STAR_PATH} />
        </svg>
      </span>
    </div>
  );
}

/** Ngôi sao lớn bừng sáng tại chỗ đậu (đặt bên trong chỗ đậu), rồi tỏa hào quang và tia sáng xoay chậm. */
export function LandedStar() {
  return (
    <motion.div
      className="motion-keep pointer-events-none relative h-full w-full"
      initial={{ scale: 0.3, opacity: 0 }}
      animate={{ scale: [0.3, 1.3, 1], opacity: 1 }}
      transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
      aria-hidden
    >
      {/* chớp sáng lúc đáp */}
      <motion.span
        className="absolute inset-[-120%] rounded-full bg-[radial-gradient(circle,rgb(255_250_225/0.85),transparent_60%)]"
        initial={{ opacity: 1, scale: 0.4 }}
        animate={{ opacity: 0, scale: 1.4 }}
        transition={{ duration: 1.2, ease: 'easeOut' }}
      />
      {/* hào quang thở */}
      <span className="absolute inset-[-70%] animate-star-glow rounded-full bg-[radial-gradient(circle,rgb(243_220_138/0.55),rgb(212_175_55/0.18)_40%,transparent_70%)]" />
      {/* tia sáng xoay chậm */}
      <svg viewBox="-50 -50 100 100" className="absolute inset-[-45%] animate-[spin_40s_linear_infinite] text-gold-light/50">
        {Array.from({ length: 16 }, (_, i) => (
          <path key={i} d="M0 -48 L1.6 -14 L-1.6 -14 Z" fill="currentColor" transform={`rotate(${i * 22.5})`} opacity={i % 2 ? 0.5 : 1} />
        ))}
      </svg>
      <svg viewBox="0 0 24 24" className="relative h-full w-full drop-shadow-[0_0_14px_rgba(243,220,138,0.9)]">
        <defs>
          <linearGradient id="landed-star" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#fffbe8" />
            <stop offset="0.5" stopColor="#f3dc8a" />
            <stop offset="1" stopColor="#d4af37" />
          </linearGradient>
        </defs>
        <path d={STAR_PATH} fill="url(#landed-star)" />
      </svg>
    </motion.div>
  );
}

'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { cn } from '@/lib/format';

function FilterButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'glass rounded-full px-4 py-2 text-sm',
        active ? 'glass-green font-semibold' : 'glass-clear',
      )}
    >
      {label}
    </button>
  );
}

/** Lọc phía client theo lớp — chỉ 13 sản phẩm nên không cần gọi server. */
export function ExhibitionFilter({
  classes,
  items,
}: {
  classes: string[];
  items: { className: string; node: React.ReactNode; key: string }[];
}) {
  const [active, setActive] = useState<string>('');
  const visible = useMemo(() => items.filter((c) => !active || c.className === active), [items, active]);
  const gridRef = useRef<HTMLDivElement>(null);

  // Điện thoại: chọn một lớp thì cuộn sản phẩm của lớp đó vào giữa màn hình.
  useEffect(() => {
    if (!active || !window.matchMedia('(max-width: 639px)').matches) return;
    const card = gridRef.current?.firstElementChild;
    if (!card) return;
    const frame = requestAnimationFrame(() => {
      const rect = card.getBoundingClientRect();
      const headerOffset = 72; // thanh menu cố định 64px + khoảng thở
      const offset = Math.max(headerOffset, (window.innerHeight - rect.height) / 2);
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      window.scrollTo({ top: rect.top + window.scrollY - offset, behavior: reduce ? 'auto' : 'smooth' });
    });
    return () => cancelAnimationFrame(frame);
  }, [active]);

  return (
    <>
      <div className="mb-10" role="group" aria-label="Lọc theo lớp">
        <div className="mb-3 flex justify-center">
          <FilterButton label="Tất cả" active={active === ''} onClick={() => setActive('')} />
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          {classes.map((c) => (
            <FilterButton key={c} label={c} active={active === c} onClick={() => setActive(c)} />
          ))}
        </div>
      </div>
      {/* Đang lọc theo lớp: dùng flex canh giữa để thẻ không bị dồn sang cột trái (tablet/laptop),
          độ rộng mỗi thẻ giữ bằng một cột của lưới. */}
      <div
        ref={gridRef}
        className={cn(
          'gap-x-8 gap-y-14',
          active ? 'flex flex-col sm:flex-row sm:flex-wrap sm:justify-center' : 'grid sm:grid-cols-2 lg:grid-cols-3',
        )}
      >
        {visible.map((c) => (
          <div
            key={c.key}
            className={cn(active && 'sm:w-[calc((100%-2rem)/2)] lg:w-[calc((100%-4rem)/3)]')}
          >
            {c.node}
          </div>
        ))}
      </div>
      {visible.length === 0 && <p className="text-center text-ivory/60">Chưa có sản phẩm nào.</p>}
    </>
  );
}

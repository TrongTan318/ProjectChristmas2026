'use client';

import { useEffect, useState } from 'react';

function split(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return { days: Math.floor(s / 86400), hours: Math.floor((s % 86400) / 3600), minutes: Math.floor((s % 3600) / 60), seconds: s % 60 };
}

/**
 * Đếm ngược theo giờ server: `serverNow` dùng để bù lệch đồng hồ điện thoại.
 */
export function Countdown({ target, serverNow, label }: { target: string; serverNow: string; label: string }) {
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    const offset = new Date(serverNow).getTime() - Date.now();
    const end = new Date(target).getTime();
    const tick = () => setRemaining(end - (Date.now() + offset));
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [target, serverNow]);

  const t = split(remaining ?? new Date(target).getTime() - new Date(serverNow).getTime());
  const units = [
    { value: t.days, label: 'Ngày' },
    { value: t.hours, label: 'Giờ' },
    { value: t.minutes, label: 'Phút' },
    { value: t.seconds, label: 'Giây' },
  ];

  return (
    <div className="text-center">
      <p className="text-sm font-semibold tracking-[0.3em] text-gold uppercase">{label}</p>
      <div className="mt-6 grid grid-cols-4 gap-2 sm:gap-5" role="timer" aria-live="off">
        {units.map((u) => (
          <div
            key={u.label}
            className="rounded-xl border border-gold/30 bg-gradient-to-b from-burgundy-dark/70 to-ink/80 px-1 py-4 shadow-[inset_0_1px_0_rgba(243,220,138,0.2)] sm:px-4 sm:py-6"
          >
            <div className="font-serif text-3xl font-bold tabular-nums text-gold-light sm:text-6xl">
              {String(u.value).padStart(2, '0')}
            </div>
            <div className="mt-1 text-xs tracking-widest text-ivory/70 uppercase sm:text-sm">{u.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { Results } from '@/server/services/results';
import { mediaUrl } from '@/lib/media';
import { formatDateTime, formatNumber } from '@/lib/format';

const POLL_MS = 10_000;

/** Bảng xếp hạng công khai, tự làm mới mỗi 10 giây. */
export function ResultsBoard({ initial, topN, compact }: { initial: Results; topN?: number; compact?: boolean }) {
  const [data, setData] = useState(initial);

  useEffect(() => {
    let stopped = false;
    const load = async () => {
      if (document.hidden) return;
      try {
        const res = await fetch('/api/results', { cache: 'no-store' });
        if (res.ok && !stopped) setData(await res.json());
      } catch {
        // mạng lỗi: giữ dữ liệu cũ
      }
    };
    const timer = setInterval(load, POLL_MS);
    return () => {
      stopped = true;
      clearInterval(timer);
    };
  }, []);

  const rows = topN ? data.ranking.slice(0, topN) : data.ranking;
  const max = Math.max(1, ...data.ranking.map((r) => r.votes));
  const zoneMax = Math.max(1, ...data.byZone.map((z) => z.votes));

  return (
    <div>
      {!compact && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: 'Tổng số phiếu', value: data.totals.issued },
            { label: 'Phiếu đã dùng', value: data.totals.used },
            { label: 'Phiếu còn lại', value: data.totals.remaining },
            { label: 'Phiếu hợp lệ', value: data.totals.validVotes },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-gold/25 bg-ink-soft/80 p-4 text-center sm:p-6">
              <div className="font-serif text-3xl font-bold text-gold-light sm:text-4xl">{formatNumber(s.value)}</div>
              <div className="mt-1 text-sm text-ivory/70">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      <ol className={compact ? 'space-y-2 sm:space-y-3' : 'mt-10 space-y-3'}>
        {rows.map((r) => (
          <li key={r.productId}>
            <Link
              href={`/trien-lam/${r.slug}`}
              className="group flex items-center gap-3 rounded-xl border border-gold/15 bg-ink-soft/70 px-3 py-2.5 transition hover:border-gold/50 sm:gap-4 sm:p-4"
            >
              <span
                className={`flex size-9 shrink-0 items-center justify-center rounded-full font-serif text-base font-bold sm:size-11 sm:text-lg ${
                  r.rank === 1
                    ? 'bg-gradient-to-b from-gold-light to-gold text-ink'
                    : r.rank === 2
                      ? 'bg-gradient-to-b from-zinc-100 to-zinc-400 text-ink'
                      : r.rank === 3
                        ? 'bg-gradient-to-b from-amber-500 to-amber-800 text-ivory'
                        : 'border border-gold/40 text-gold-light'
                }`}
              >
                {r.rank}
              </span>
              {r.coverKey && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={mediaUrl(r.coverKey, 400)}
                  alt=""
                  loading="lazy"
                  className="hidden h-14 w-20 shrink-0 rounded object-cover ring-1 ring-gold/30 sm:block"
                />
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="truncate font-serif text-base font-semibold text-ivory group-hover:text-gold-light sm:text-lg">
                    {r.name}
                  </p>
                  <p className="shrink-0 font-semibold text-gold-light tabular-nums">
                    {formatNumber(r.votes)} <span className="text-sm font-normal text-ivory/60">phiếu</span>
                  </p>
                </div>
                <p className="truncate text-sm text-ivory/60">
                  {r.className}
                  {r.teamName ? ` · ${r.teamName}` : ''} · {r.percent.toFixed(1)}%
                </p>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-ivory/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-gold-dark via-gold to-gold-light transition-[width] duration-700"
                    style={{ width: `${(r.votes / max) * 100}%` }}
                  />
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ol>

      {!compact && data.byZone.length > 0 && (
        <div className="mt-14">
          <h3 className="text-center font-serif text-2xl text-gold-light">Thống kê theo giáo khu</h3>
          <div className="mt-6 space-y-3">
            {data.byZone.map((z) => (
              <div key={z.zoneId ?? 'none'} className="flex items-center gap-3">
                <span className="w-36 shrink-0 truncate text-sm text-ivory/80 sm:w-48">{z.name}</span>
                <div className="h-3 flex-1 overflow-hidden rounded-full bg-ivory/10">
                  <div className="h-full rounded-full bg-gradient-to-r from-[#7a1e17] via-burgundy-light to-pine-light" style={{ width: `${(z.votes / zoneMax) * 100}%` }} />
                </div>
                <span className="w-12 text-right text-sm font-semibold text-gold-light tabular-nums">{z.votes}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="mt-8 text-center text-xs text-ivory/50">
        Cập nhật lúc {formatDateTime(data.updatedAt)} · tự động làm mới mỗi 10 giây
      </p>
    </div>
  );
}

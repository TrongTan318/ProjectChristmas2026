'use client';

import Link from 'next/link';
import { useState, useTransition } from 'react';
import { mediaSrcSet, mediaUrl } from '@/lib/media';
import { formatDateTime } from '@/lib/format';
import { VOTE_MESSAGES } from '@/lib/vote-messages';
import { submitVote, type VoteResult } from './actions';

interface Item {
  id: string;
  slug: string;
  name: string;
  className: string;
  teamName: string;
  coverKey: string | null;
  blur: string | null;
}

function Cover({ item, className }: { item: Item; className: string }) {
  if (!item.coverKey) return <div className={`${className} bg-burgundy-dark`} aria-hidden />;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={mediaUrl(item.coverKey, 800)}
      srcSet={mediaSrcSet(item.coverKey)}
      sizes="(min-width: 768px) 360px, 100vw"
      alt={item.name}
      loading="lazy"
      decoding="async"
      className={`${className} object-cover`}
      style={item.blur ? { backgroundImage: `url(${item.blur})`, backgroundSize: 'cover' } : undefined}
    />
  );
}

export function VoteClient({ products, serial, initialSelected }: { products: Item[]; serial: string; initialSelected: string | null }) {
  const [selected, setSelected] = useState<string | null>(initialSelected);
  const [result, setResult] = useState<VoteResult | null>(null);
  const [networkError, setNetworkError] = useState(false);
  const [pending, startTransition] = useTransition();
  const chosen = products.find((p) => p.id === selected);

  const confirm = () => {
    if (!chosen) return;
    setNetworkError(false);
    startTransition(async () => {
      try {
        setResult(await submitVote(chosen.id));
      } catch {
        // Mất mạng: cho thử lại. Gửi lại an toàn vì server xử lý idempotent.
        setNetworkError(true);
      }
    });
  };

  if (result?.ok) {
    return (
      <div className="rounded-2xl border-2 border-gold bg-white p-8 text-center shadow-lg" role="status">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-b from-gold-light to-gold text-5xl text-ink" aria-hidden>
          ✓
        </div>
        <h1 className="mt-6 font-serif text-3xl font-bold text-burgundy-dark sm:text-4xl">Cảm ơn bạn đã bình chọn!</h1>
        <p className="mt-5 text-xl">Bạn đã bình chọn cho</p>
        <p className="mt-2 font-serif text-2xl font-bold text-burgundy">{result.productName}</p>
        <dl className="mx-auto mt-6 max-w-xs space-y-1 text-lg text-ink/75">
          <div className="flex justify-between"><dt>Phiếu số</dt><dd className="font-semibold">{result.serial}</dd></div>
          <div className="flex justify-between"><dt>Thời gian</dt><dd className="font-semibold">{formatDateTime(result.votedAt)}</dd></div>
        </dl>
        <p className="mt-6 font-serif text-lg text-ink/70 italic">Xin Chúa Hài Đồng chúc lành cho bạn và gia đình. Giáng Sinh an lành!</p>
        <div className="mt-8 flex flex-col gap-3">
          <Link href="/trien-lam" className="btn-gold !py-4 text-xl">Tiếp tục tham quan triển lãm</Link>
          <Link href="/ket-qua" className="text-lg text-burgundy underline">Xem kết quả</Link>
        </div>
      </div>
    );
  }

  if (result && !result.ok) {
    const msg = VOTE_MESSAGES[result.code];
    const canRetry = result.code === 'PRODUCT_NOT_FOUND' || result.code === 'RATE_LIMITED';
    return (
      <div className="rounded-2xl border-2 border-burgundy/30 bg-white p-8 text-center shadow-md" role="alert">
        <h1 className="font-serif text-3xl font-bold text-burgundy-dark">{msg.title}</h1>
        <p className="mt-4 text-xl text-ink/80">{msg.body}</p>
        <div className="mt-8 flex flex-col gap-3">
          {canRetry ? (
            <button type="button" className="btn-gold !py-4 text-xl" onClick={() => { setResult(null); setSelected(null); }}>
              Chọn lại
            </button>
          ) : (
            <Link href="/vote" className="btn-gold !py-4 text-xl">Quét / nhập mã phiếu</Link>
          )}
          <Link href="/trien-lam" className="text-lg text-burgundy underline">Tham quan triển lãm</Link>
        </div>
      </div>
    );
  }

  // Màn hình xác nhận
  if (chosen) {
    return (
      <div>
        <p className="text-center text-lg text-ink/70">Bước 2/2 · Xác nhận</p>
        <h1 className="mt-2 text-center font-serif text-3xl font-bold text-burgundy-dark">Bạn chọn hang đá này?</h1>
        <div className="mt-6 overflow-hidden rounded-2xl border-4 border-gold bg-white shadow-lg">
          <Cover item={chosen} className="aspect-[4/3] w-full" />
          <div className="p-5 text-center">
            <p className="text-base font-semibold tracking-widest text-burgundy uppercase">{chosen.className}</p>
            <p className="mt-1 font-serif text-3xl font-bold">{chosen.name}</p>
            {chosen.teamName && <p className="mt-1 text-lg text-ink/70">{chosen.teamName}</p>}
          </div>
        </div>
        <p className="mt-6 rounded-xl bg-amber-50 p-4 text-center text-lg text-amber-900">
          Sau khi xác nhận, phiếu số <strong>{serial}</strong> sẽ được khóa và <strong>không thể đổi lựa chọn</strong>.
        </p>
        {networkError && (
          <p role="alert" className="mt-4 rounded-xl bg-red-50 p-4 text-center text-lg text-red-800">
            Không gửi được do mạng yếu. Vui lòng bấm “Xác nhận bình chọn” lần nữa.
          </p>
        )}
        <div className="mt-6 flex flex-col gap-4">
          <button type="button" onClick={confirm} disabled={pending} className="btn-gold min-h-16 !py-5 text-2xl">
            {pending ? 'Đang gửi…' : '✓ Xác nhận bình chọn'}
          </button>
          <button
            type="button"
            onClick={() => setSelected(null)}
            disabled={pending}
            className="min-h-14 rounded-full border-2 border-ink/30 bg-white py-4 text-xl font-semibold text-ink"
          >
            ← Chọn lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <p className="text-center text-lg text-ink/70">Phiếu số {serial} · Bước 1/2</p>
      <h1 className="mt-2 text-center font-serif text-3xl font-bold text-burgundy-dark sm:text-4xl">Chọn hang đá bạn yêu thích</h1>
      <p className="mt-3 text-center text-lg text-ink/75">Chạm nút <strong>“Chọn”</strong> dưới hang đá bạn muốn bình chọn.</p>
      <ul className="mt-8 grid gap-6 sm:grid-cols-2">
        {products.map((p) => (
          <li key={p.id} className="overflow-hidden rounded-2xl bg-white shadow-md ring-1 ring-gold-dark/25">
            <Cover item={p} className="aspect-[4/3] w-full" />
            <div className="p-4">
              <p className="text-sm font-semibold tracking-widest text-burgundy uppercase">{p.className}</p>
              <p className="mt-1 font-serif text-2xl leading-snug font-bold">{p.name}</p>
              <div className="mt-4 flex gap-3">
                <button type="button" onClick={() => { setSelected(p.id); window.scrollTo({ top: 0 }); }} className="btn-gold min-h-14 flex-1 text-xl">
                  Chọn
                </button>
                <Link href={`/trien-lam/${p.slug}`} className="flex min-h-14 items-center rounded-full border-2 border-ink/25 px-5 text-lg font-medium">
                  Xem
                </Link>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

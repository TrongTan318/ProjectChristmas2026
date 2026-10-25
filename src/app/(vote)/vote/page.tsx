import type { Metadata } from 'next';
import { ManualCodeForm } from './ManualCodeForm';

export const metadata: Metadata = { title: 'Bình chọn', robots: { index: false } };

export default function ManualVotePage() {
  return (
    <div>
      <h1 className="font-serif text-3xl font-bold text-burgundy-dark sm:text-4xl">Bình chọn hang đá</h1>

      <ol className="mt-8 space-y-4">
        {[
          ['Mở camera điện thoại', 'và hướng vào mã QR trên phiếu bình chọn.'],
          ['Chạm vào đường link hiện ra', 'để mở trang bình chọn.'],
          ['Chọn hang đá yêu thích', 'rồi bấm “Xác nhận bình chọn”.'],
        ].map(([title, body], i) => (
          <li key={i} className="flex gap-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gold-dark/20">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-burgundy text-2xl font-bold text-gold-light">
              {i + 1}
            </span>
            <p className="text-xl leading-snug">
              <strong>{title}</strong> {body}
            </p>
          </li>
        ))}
      </ol>

      <div className="mt-10 rounded-2xl border-2 border-gold bg-white p-6 shadow-md">
        <h2 className="text-2xl font-bold text-burgundy-dark">Không quét được mã QR?</h2>
        <p className="mt-2 text-ink/75">Nhập mã 16 ký tự in trên phiếu (không cần gõ dấu gạch ngang):</p>
        <ManualCodeForm />
      </div>
    </div>
  );
}

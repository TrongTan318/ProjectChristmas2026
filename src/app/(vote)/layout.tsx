import Link from 'next/link';
import { getSiteSettings, requireActiveContest } from '@/server/contest';

/**
 * Layout riêng cho luồng bình chọn: nền sáng, chữ to, không tải hiệu ứng nặng,
 * để người lớn tuổi và điện thoại cấu hình thấp dùng dễ dàng.
 */
export default async function VoteLayout({ children }: { children: React.ReactNode }) {
  const contest = await requireActiveContest();
  const settings = await getSiteSettings(contest.id);
  return (
    <div className="min-h-dvh bg-ivory text-ink [color-scheme:light]">
      {/* Header nền tối: nút kính dùng kiểu nền tối như menu chính; phần nội dung bên dưới mới là .surface-light */}
      <header className="border-b-4 border-gold bg-burgundy-dark text-ivory">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-4">
          <Link href="/" className="flex items-center gap-2" aria-label={contest.name}>
            <svg width="28" height="28" viewBox="0 0 24 24" className="shrink-0 text-gold" fill="currentColor" aria-hidden>
              <path d="M12 0l2.4 8.6L24 12l-9.6 3.4L12 24l-2.4-8.6L0 12l9.6-3.4z" />
            </svg>
            {/* Điện thoại: chỉ hiện ngôi sao để chừa chỗ cho Triển lãm + nút Trang chủ */}
            <span className="hidden font-serif text-xl leading-tight font-semibold sm:inline">{contest.name}</span>
          </Link>
          <nav className="flex shrink-0 items-center gap-2 sm:gap-3" aria-label="Điều hướng">
            <Link href="/trien-lam" className="btn-glass-clear min-h-12 !gap-1.5 !px-3.5 !py-2 text-lg sm:!px-4">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M4 4h16v13H4zm2 2v9h12V6zm1 13h10v2H7zm1-4l3-4 2 2.5 1.5-2 2.5 3.5z" />
              </svg>
              Triển lãm
            </Link>
            <Link href="/" className="btn-glass min-h-12 !gap-1.5 !px-3.5 !py-2 text-lg sm:!px-4">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M12 3l9 8h-3v9h-5v-6h-2v6H6v-9H3z" />
              </svg>
              Trang chủ
            </Link>
          </nav>
        </div>
      </header>
      <main className="surface-light mx-auto max-w-3xl px-4 py-8 text-lg sm:py-12">{children}</main>
      <footer className="mx-auto max-w-3xl px-4 pb-10 text-center text-base text-ink/70">
        <p>{settings.voteHelp}</p>
        {settings.contactPhone && (
          <p className="mt-2">
            Hotline:{' '}
            <a className="font-semibold text-burgundy underline" href={`tel:${settings.contactPhone.replace(/\s/g, '')}`}>
              {settings.contactPhone}
            </a>
          </p>
        )}
      </footer>
    </div>
  );
}

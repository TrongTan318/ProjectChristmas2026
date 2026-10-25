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
      <header className="border-b-4 border-gold bg-burgundy-dark text-ivory">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-4">
          <Link href="/" className="flex items-center gap-2">
            <svg width="28" height="28" viewBox="0 0 24 24" className="shrink-0 text-gold" fill="currentColor" aria-hidden>
              <path d="M12 0l2.4 8.6L24 12l-9.6 3.4L12 24l-2.4-8.6L0 12l9.6-3.4z" />
            </svg>
            <span className="font-serif text-lg leading-tight font-semibold sm:text-xl">{contest.name}</span>
          </Link>
          <Link href="/trien-lam" className="shrink-0 text-base text-gold-light underline underline-offset-4">
            Triển lãm
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-8 text-lg sm:py-12">{children}</main>
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

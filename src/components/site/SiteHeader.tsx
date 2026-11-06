'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/format';

const NAV = [
  { href: '/', label: 'Trang chủ' },
  { href: '/trien-lam', label: 'Triển lãm' },
  { href: '/ket-qua', label: 'Kết quả' },
  { href: '/tin-tuc', label: 'Tin tức' },
];

export function SiteHeader({ title }: { title: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href));
  // Chỉ trong suốt khi nằm trên ảnh nền tối của trang chủ; các trang khác có thể mở đầu bằng nền sáng
  // (vd. Tin tức) nên luôn có nền để chữ menu không bị chìm.
  const solid = scrolled || open || pathname !== '/';

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-50 transition-all duration-300',
        // Dải chuyển 3 màu Giáng Sinh (đỏ sẫm → nâu đỏ → xanh thông), hơi trong để thấy mờ phía sau
        solid
          ? 'border-b border-gold/25 bg-[linear-gradient(120deg,rgb(59_9_7/0.92),rgb(84_44_42/0.88)_50%,rgb(17_54_33/0.92))] shadow-[0_8px_24px_-12px_rgb(0_0_0/0.8)] backdrop-blur-md'
          : 'bg-transparent',
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5" aria-label={title}>
          <svg width="30" height="30" viewBox="0 0 24 24" className="text-gold" fill="currentColor" aria-hidden>
            <path d="M12 0l2.4 8.6L24 12l-9.6 3.4L12 24l-2.4-8.6L0 12l9.6-3.4z" />
          </svg>
          <span className="font-serif text-lg leading-none font-semibold text-gold-light">
            Hang Đá <span className="text-ivory">2026</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Điều hướng chính">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'rounded-full px-4 py-2 text-[15px] font-semibold transition-colors',
                isActive(item.href)
                  ? 'bg-gold/15 text-gold-light ring-1 ring-gold/50'
                  : 'text-ivory hover:bg-ivory/10 hover:text-gold-light',
              )}
            >
              {item.label}
            </Link>
          ))}
          <Link href="/vote" className="btn-glass ml-3 !px-5 !py-2 text-sm">
            Bình chọn
          </Link>
        </nav>

        <button
          type="button"
          className="glass glass-clear inline-flex h-11 w-11 items-center justify-center rounded-full md:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? 'Đóng menu' : 'Mở menu'}
          onClick={() => setOpen((v) => !v)}
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
          </svg>
        </button>
      </div>

      {open && (
        <nav id="mobile-nav" className="border-t border-gold/15 px-4 pt-2 pb-6 md:hidden" aria-label="Điều hướng">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'block rounded-lg px-3 py-3.5 text-lg',
                isActive(item.href) ? 'bg-gold/10 text-gold-light' : 'text-ivory/90',
              )}
            >
              {item.label}
            </Link>
          ))}
          <Link href="/vote" className="btn-glass mt-4 w-full text-lg">
            Bình chọn ngay
          </Link>
        </nav>
      )}
    </header>
  );
}

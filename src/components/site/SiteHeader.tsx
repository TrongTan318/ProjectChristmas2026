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

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-50 transition-all duration-300',
        scrolled || open ? 'border-b border-gold/20 bg-ink/90 backdrop-blur-md' : 'bg-transparent',
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
                'rounded-full px-4 py-2 text-sm font-medium transition-colors',
                isActive(item.href) ? 'text-gold-light' : 'text-ivory/80 hover:text-gold-light',
              )}
            >
              {item.label}
            </Link>
          ))}
          <Link href="/vote" className="btn-gold ml-3 !px-5 !py-2 text-sm">
            Bình chọn
          </Link>
        </nav>

        <button
          type="button"
          className="inline-flex h-11 w-11 items-center justify-center rounded-full text-gold-light md:hidden"
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
          <Link href="/vote" className="btn-gold mt-4 w-full text-lg">
            Bình chọn ngay
          </Link>
        </nav>
      )}
    </header>
  );
}

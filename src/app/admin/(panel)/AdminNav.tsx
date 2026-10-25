'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/format';

const ITEMS = [
  { href: '/admin', label: 'Tổng quan', icon: '◈' },
  { href: '/admin/teams', label: 'Đội thi', icon: '👥' },
  { href: '/admin/products', label: 'Sản phẩm', icon: '🖼' },
  { href: '/admin/tokens', label: 'Phiếu QR', icon: '▦' },
  { href: '/admin/votes', label: 'Phiếu bầu', icon: '✓' },
  { href: '/admin/zones', label: 'Giáo khu', icon: '⌂' },
  { href: '/admin/banners', label: 'Banner', icon: '▭' },
  { href: '/admin/news', label: 'Tin tức', icon: '✎' },
  { href: '/admin/sponsors', label: 'Nhà tài trợ', icon: '★' },
  { href: '/admin/settings', label: 'Cài đặt', icon: '⚙' },
  { href: '/admin/users', label: 'Tài khoản', icon: '🔑', superOnly: true },
  { href: '/admin/audit', label: 'Nhật ký', icon: '☰', superOnly: true },
];

export function AdminNav({ superAdmin }: { superAdmin: boolean }) {
  const pathname = usePathname();
  return (
    <nav className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-col lg:overflow-visible lg:pb-0" aria-label="Quản trị">
      {ITEMS.filter((i) => !i.superOnly || superAdmin).map((item) => {
        const active = item.href === '/admin' ? pathname === '/admin' : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex shrink-0 items-center gap-3 rounded-lg px-3 py-2 text-sm whitespace-nowrap transition-colors',
              active ? 'bg-gold/15 text-gold-light' : 'text-ivory/80 hover:bg-white/5 hover:text-ivory',
            )}
          >
            <span className="w-5 text-center" aria-hidden>{item.icon}</span>
            {item.label}
          </Link>
        );
      })}
      <Link href="/" target="_blank" className="flex shrink-0 items-center gap-3 rounded-lg px-3 py-2 text-sm text-ivory/60 hover:text-ivory lg:mt-4">
        <span className="w-5 text-center" aria-hidden>↗</span>Xem website
      </Link>
    </nav>
  );
}

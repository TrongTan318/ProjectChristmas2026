import Link from 'next/link';
import type { SiteSettings } from '@/server/contest';
import { EffectsToggle } from '../effects/EffectsToggle';
import { Ornament } from './Decor';

export function SiteFooter({ settings, organizer }: { settings: SiteSettings; organizer: string }) {
  return (
    <footer className="relative border-t border-gold/20 bg-ink">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold to-transparent" />
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-3">
        <div>
          <p className="font-serif text-2xl text-gold-gradient">Hang Đá Giáng Sinh 2026</p>
          <p className="mt-3 text-ivory/70">{organizer}</p>
          <p className="mt-4 font-serif text-ivory/80 italic">
            “Hôm nay, một Đấng Cứu Độ đã sinh ra cho anh em.” <span className="not-italic">(Lc 2,11)</span>
          </p>
        </div>
        <div>
          <p className="text-sm font-semibold tracking-widest text-gold uppercase">Liên hệ</p>
          <ul className="mt-4 space-y-2 text-ivory/80">
            {settings.address && <li>{settings.address}</li>}
            {settings.contactPhone && (
              <li>
                Điện thoại:{' '}
                <a className="hover:text-gold-light" href={`tel:${settings.contactPhone.replace(/\s/g, '')}`}>
                  {settings.contactPhone}
                </a>
              </li>
            )}
            {settings.contactEmail && (
              <li>
                Email:{' '}
                <a className="hover:text-gold-light" href={`mailto:${settings.contactEmail}`}>
                  {settings.contactEmail}
                </a>
              </li>
            )}
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold tracking-widest text-gold uppercase">Khám phá</p>
          <ul className="mt-4 space-y-2 text-ivory/80">
            <li><Link className="hover:text-gold-light" href="/trien-lam">Triển lãm hang đá</Link></li>
            <li><Link className="hover:text-gold-light" href="/vote">Bình chọn bằng mã phiếu</Link></li>
            <li><Link className="hover:text-gold-light" href="/ket-qua">Kết quả bình chọn</Link></li>
            <li><Link className="hover:text-gold-light" href="/tin-tuc">Tin tức</Link></li>
            {settings.facebookUrl && (
              <li><a className="hover:text-gold-light" href={settings.facebookUrl} rel="noopener noreferrer" target="_blank">Facebook</a></li>
            )}
            {settings.youtubeUrl && (
              <li><a className="hover:text-gold-light" href={settings.youtubeUrl} rel="noopener noreferrer" target="_blank">YouTube</a></li>
            )}
          </ul>
          <div className="mt-6">
            <EffectsToggle />
          </div>
        </div>
      </div>
      <Ornament className="pb-4" />
      <p className="pb-8 text-center text-xs text-ivory/50">
        © 2026 {organizer}. Ad Majorem Dei Gloriam.
      </p>
    </footer>
  );
}

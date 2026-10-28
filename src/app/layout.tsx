import type { Metadata, Viewport } from 'next';
import { Be_Vietnam_Pro, Playfair_Display } from 'next/font/google';
import { MusicPlayer } from '@/components/effects/MusicPlayer';
import { getMusicTracks } from '@/server/music';
import './globals.css';

const sans = Be_Vietnam_Pro({
  subsets: ['latin', 'vietnamese'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans-family',
  display: 'swap',
});

const serif = Playfair_Display({
  subsets: ['latin', 'vietnamese'],
  variable: '--font-serif-family',
  display: 'swap',
});

// Mọi trang đọc dữ liệu lúc chạy (không prerender lúc build khi chưa có DB).
// Hiệu năng được đảm bảo bằng cache trong bộ nhớ + microcache của Nginx.
export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  return {
    metadataBase: new URL(process.env.PUBLIC_BASE_URL ?? 'http://localhost:3000'),
    title: { default: 'Hội Thi Hang Đá Giáng Sinh 2026', template: '%s · Hang Đá Giáng Sinh 2026' },
    description: 'Triển lãm trực tuyến và bình chọn hang đá Giáng Sinh 2026 — Giáo xứ Bình Thới.',
    icons: { icon: '/icon.svg' },
  };
}

export const viewport: Viewport = {
  themeColor: '#0f0908',
  width: 'device-width',
  initialScale: 1,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const tracks = await getMusicTracks();
  return (
    <html lang="vi" className={`${sans.variable} ${serif.variable}`}>
      <body className="min-h-dvh antialiased">
        {children}
        {/* Ở root layout để nhạc không bị ngắt khi chuyển giữa trang triển lãm và bình chọn. */}
        <MusicPlayer tracks={tracks} />
      </body>
    </html>
  );
}

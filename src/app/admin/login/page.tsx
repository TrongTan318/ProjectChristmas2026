import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getCurrentAdmin } from '@/server/auth';
import { LoginForm } from './LoginForm';

export const metadata: Metadata = { title: 'Đăng nhập quản trị', robots: { index: false } };

export default async function LoginPage() {
  if (await getCurrentAdmin()) redirect('/admin');
  return (
    <main className="bg-museum flex min-h-dvh items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-2xl border border-gold/30 bg-ink-soft/90 p-8 shadow-2xl">
        <div className="text-center">
          <svg width="40" height="40" viewBox="0 0 24 24" className="mx-auto text-gold" fill="currentColor" aria-hidden>
            <path d="M12 0l2.4 8.6L24 12l-9.6 3.4L12 24l-2.4-8.6L0 12l9.6-3.4z" />
          </svg>
          <h1 className="mt-4 font-serif text-2xl text-gold-gradient">Quản trị Hội Thi</h1>
          <p className="mt-1 text-sm text-ivory/60">Hang Đá Giáng Sinh 2026</p>
        </div>
        <LoginForm />
      </div>
    </main>
  );
}

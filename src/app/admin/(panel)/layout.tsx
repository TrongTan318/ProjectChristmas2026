import type { Metadata } from 'next';
import { requireAdmin, isSuperAdmin } from '@/server/auth';
import { requireActiveContest } from '@/server/contest';
import { AdminNav } from './AdminNav';
import { logout } from '../login/actions';

export const metadata: Metadata = { title: 'Quản trị', robots: { index: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin();
  const contest = await requireActiveContest();
  const superAdmin = isSuperAdmin(user);

  return (
    <div className="min-h-dvh bg-zinc-50 text-zinc-900 [color-scheme:light] lg:flex">
      <aside className="border-b border-zinc-800 bg-ink text-ivory lg:sticky lg:top-0 lg:h-dvh lg:w-64 lg:shrink-0 lg:border-r lg:border-b-0">
        <div className="flex items-center gap-2 px-5 py-4">
          <svg width="26" height="26" viewBox="0 0 24 24" className="text-gold" fill="currentColor" aria-hidden>
            <path d="M12 0l2.4 8.6L24 12l-9.6 3.4L12 24l-2.4-8.6L0 12l9.6-3.4z" />
          </svg>
          <div className="leading-tight">
            <p className="font-serif text-gold-light">Quản trị</p>
            <p className="text-xs text-ivory/60">{contest.name}</p>
          </div>
        </div>
        <AdminNav superAdmin={superAdmin} />
        <div className="hidden border-t border-white/10 px-5 py-4 text-sm lg:block">
          <p className="truncate font-medium">{user.name}</p>
          <p className="truncate text-xs text-ivory/60">{user.role.name}</p>
          <form action={logout} className="mt-3">
            <button className="text-sm text-gold-light hover:underline">Đăng xuất</button>
          </form>
        </div>
      </aside>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between border-b border-zinc-200 bg-white px-4 py-2 text-sm lg:hidden">
          <span className="truncate">{user.name} · {user.role.name}</span>
          <form action={logout}>
            <button className="text-burgundy">Đăng xuất</button>
          </form>
        </div>
        <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">{children}</div>
      </div>
    </div>
  );
}

import type { Metadata } from 'next';
import Link from 'next/link';
import { SectionHeading } from '@/components/site/Decor';
import { Picture } from '@/components/site/Picture';
import { formatDate } from '@/lib/format';
import { requireActiveContest } from '@/server/contest';
import { listAnnouncements } from '@/server/services/content';

export const metadata: Metadata = { title: 'Tin tức' };

export default async function NewsPage() {
  const contest = await requireActiveContest();
  const news = await listAnnouncements(contest.id);
  return (
    <section className="bg-parchment-texture min-h-screen pt-32 pb-24">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <SectionHeading light eyebrow="Tin tức" title="Tin từ Ban tổ chức" />
        <div className="mt-14 space-y-8">
          {news.length === 0 && <p className="text-center text-ink/60">Chưa có tin tức.</p>}
          {news.map((n) => (
            <Link
              key={n.id}
              href={`/tin-tuc/${n.slug}`}
              className="group grid overflow-hidden rounded-xl bg-white shadow-md ring-1 ring-gold-dark/20 sm:grid-cols-3"
            >
              <Picture imageKey={n.coverKey} alt={n.title} sizes="(min-width: 640px) 33vw, 100vw" className="aspect-[16/9] h-full w-full sm:aspect-auto" />
              <div className="p-6 sm:col-span-2">
                <p className="text-sm text-burgundy">{formatDate(n.publishedAt)}</p>
                <h2 className="mt-2 font-serif text-2xl font-semibold text-ink group-hover:text-burgundy">{n.title}</h2>
                {n.excerpt && <p className="mt-3 text-ink/70">{n.excerpt}</p>}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

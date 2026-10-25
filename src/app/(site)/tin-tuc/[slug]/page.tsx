import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Ornament } from '@/components/site/Decor';
import { Picture } from '@/components/site/Picture';
import { formatDate } from '@/lib/format';
import { mediaUrl } from '@/lib/media';
import { requireActiveContest } from '@/server/contest';
import { getAnnouncement } from '@/server/services/content';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const contest = await requireActiveContest();
  const item = await getAnnouncement(contest.id, slug);
  if (!item) return { title: 'Không tìm thấy' };
  return {
    title: item.title,
    description: item.excerpt,
    openGraph: { title: item.title, description: item.excerpt, images: item.coverKey ? [mediaUrl(item.coverKey, 1600)] : undefined },
  };
}

export default async function NewsDetailPage({ params }: Props) {
  const { slug } = await params;
  const contest = await requireActiveContest();
  const item = await getAnnouncement(contest.id, slug);
  if (!item) notFound();

  return (
    <article className="bg-parchment-texture min-h-screen pt-32 pb-24">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <Link href="/tin-tuc" className="text-sm text-burgundy hover:underline">← Tất cả tin tức</Link>
        <p className="mt-8 text-sm text-burgundy">{formatDate(item.publishedAt)}</p>
        <h1 className="mt-2 font-serif text-4xl leading-tight font-bold text-burgundy-dark sm:text-5xl">{item.title}</h1>
        <Ornament className="mt-6 !justify-start" />
        {item.coverKey && (
          <Picture imageKey={item.coverKey} alt={item.title} sizes="(min-width: 768px) 768px, 100vw" fallbackSize={1600} priority className="mt-8 w-full rounded-xl shadow-lg" />
        )}
        <div className="prose-museum mt-10 text-lg leading-relaxed text-ink/85">
          {item.content.split(/\n{2,}/).map((p, i) => (
            <p key={i} className="whitespace-pre-line">{p}</p>
          ))}
        </div>
      </div>
    </article>
  );
}

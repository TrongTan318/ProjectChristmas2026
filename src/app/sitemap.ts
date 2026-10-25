import type { MetadataRoute } from 'next';
import { getActiveContest } from '@/server/contest';
import { listAnnouncements, listProducts } from '@/server/services/content';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.PUBLIC_BASE_URL ?? 'http://localhost:3000';
  const contest = await getActiveContest();
  const staticPages = ['', '/trien-lam', '/ket-qua', '/tin-tuc'].map((p) => ({ url: `${base}${p}` }));
  if (!contest) return staticPages;
  const [products, news] = await Promise.all([listProducts(contest.id), listAnnouncements(contest.id)]);
  return [
    ...staticPages,
    ...products.map((p) => ({ url: `${base}/trien-lam/${p.slug}` })),
    ...news.map((n) => ({ url: `${base}/tin-tuc/${n.slug}`, lastModified: n.updatedAt })),
  ];
}

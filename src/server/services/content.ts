import 'server-only';
import { pickFeatured } from '@/domain/voting';
import { prisma } from '../db';
import { cached } from '../cache';
import { hit } from '../rate-limit';
import { getResults } from './results';

const TTL = 30_000;

/** Ảnh đại diện trước, kèm vài ảnh tiếp theo cho slideshow trên thẻ sản phẩm. */
const coverSelect = {
  where: { deletedAt: null },
  orderBy: [{ isCover: 'desc' as const }, { sortOrder: 'asc' as const }],
  take: 5,
  select: { key: true, width: true, height: true, blurDataUrl: true, alt: true },
};

export function listProducts(contestId: string) {
  return cached(`c:products:${contestId}`, TTL, () =>
    prisma.product.findMany({
      where: { contestId, status: 'PUBLISHED', deletedAt: null },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      select: {
        id: true,
        slug: true,
        name: true,
        shortDescription: true,
        viewCount: true,
        team: { select: { name: true, className: true } },
        images: coverSelect,
        _count: { select: { images: { where: { deletedAt: null } } } },
      },
    }),
  );
}

export type ProductListItem = Awaited<ReturnType<typeof listProducts>>[number];

/** "Nổi bật": 3 sản phẩm nhiều phiếu nhất (bằng phiếu xét lượt xem); rỗng khi chưa có phiếu. */
export async function listFeatured(contestId: string) {
  const [products, results] = await Promise.all([listProducts(contestId), getResults(contestId)]);
  const votes = new Map(results.ranking.map((r) => [r.productId, r.votes]));
  return pickFeatured(products.map((p) => ({ ...p, votes: votes.get(p.id) ?? 0, views: p.viewCount })));
}

export function getProductBySlug(contestId: string, slug: string) {
  return cached(`c:product:${contestId}:${slug}`, TTL, () =>
    prisma.product.findFirst({
      where: { contestId, slug, status: 'PUBLISHED', deletedAt: null },
      include: {
        team: true,
        images: { where: { deletedAt: null }, orderBy: [{ isCover: 'desc' }, { sortOrder: 'asc' }] },
        videos: { where: { deletedAt: null }, orderBy: [{ isIntro: 'desc' }, { sortOrder: 'asc' }] },
      },
    }),
  );
}

export function listBanners(contestId: string) {
  return cached(`c:banners:${contestId}`, TTL, () =>
    prisma.banner.findMany({
      where: { contestId, isActive: true, deletedAt: null },
      orderBy: { sortOrder: 'asc' },
    }),
  );
}

export function listAnnouncements(contestId: string, take = 50) {
  return cached(`c:news:${contestId}:${take}`, TTL, () =>
    prisma.announcement.findMany({
      where: { contestId, isPublished: true, deletedAt: null },
      orderBy: { publishedAt: 'desc' },
      take,
    }),
  );
}

export function getAnnouncement(contestId: string, slug: string) {
  return cached(`c:news-item:${contestId}:${slug}`, TTL, () =>
    prisma.announcement.findFirst({ where: { contestId, slug, isPublished: true, deletedAt: null } }),
  );
}

export function listSponsors(contestId: string) {
  return cached(`c:sponsors:${contestId}`, TTL, () =>
    prisma.sponsor.findMany({
      where: { contestId, isActive: true, deletedAt: null },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    }),
  );
}

const BOT_PATTERN = /bot|crawl|spider|slurp|facebookexternalhit|zalo.*preview|preview/i;

/** Đếm lượt xem: tối đa 1 lượt / IP / sản phẩm / 30 phút, bỏ qua bot. */
export async function recordView(productId: string, ip: string, userAgent: string) {
  if (!userAgent || BOT_PATTERN.test(userAgent)) return;
  if (!hit(`view:${ip}:${productId}`, 1, 30 * 60_000)) return;
  await prisma.product
    .updateMany({ where: { id: productId, status: 'PUBLISHED', deletedAt: null }, data: { viewCount: { increment: 1 } } })
    .catch(() => {});
}

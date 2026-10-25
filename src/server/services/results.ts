import 'server-only';
import { rank } from '@/domain/voting';
import { prisma } from '../db';
import { cached } from '../cache';

export interface RankingRow {
  rank: number;
  productId: string;
  slug: string;
  name: string;
  teamName: string;
  className: string;
  coverKey: string | null;
  votes: number;
  percent: number;
}

export interface Results {
  totals: { issued: number; used: number; remaining: number; revoked: number; validVotes: number; invalidVotes: number };
  ranking: RankingRow[];
  byZone: { zoneId: string | null; name: string; votes: number }[];
  updatedAt: string;
}

async function computeResults(contestId: string): Promise<Results> {
  const [tokenGroups, voteGroups, zoneGroups, products, zones] = await Promise.all([
    prisma.voteToken.groupBy({ by: ['status'], where: { contestId, deletedAt: null }, _count: { _all: true } }),
    prisma.vote.groupBy({
      by: ['productId', 'status'],
      where: { contestId, deletedAt: null },
      _count: { _all: true },
    }),
    prisma.vote.groupBy({
      by: ['zoneId'],
      where: { contestId, deletedAt: null, status: 'VALID' },
      _count: { _all: true },
    }),
    prisma.product.findMany({
      where: { contestId, status: 'PUBLISHED', deletedAt: null },
      select: {
        id: true,
        slug: true,
        name: true,
        team: { select: { name: true, className: true } },
        images: {
          where: { deletedAt: null },
          orderBy: [{ isCover: 'desc' }, { sortOrder: 'asc' }],
          take: 1,
          select: { key: true },
        },
      },
    }),
    prisma.zone.findMany({ where: { deletedAt: null }, orderBy: { sortOrder: 'asc' } }),
  ]);

  const tokenCount = (s: string) => tokenGroups.find((g) => g.status === s)?._count._all ?? 0;
  const validByProduct = new Map<string, number>();
  let validVotes = 0;
  let invalidVotes = 0;
  for (const g of voteGroups) {
    if (g.status === 'VALID') {
      validByProduct.set(g.productId, g._count._all);
      validVotes += g._count._all;
    } else invalidVotes += g._count._all;
  }

  const ranking = rank(
    products.map((p) => ({
      productId: p.id,
      slug: p.slug,
      name: p.name,
      teamName: p.team?.name ?? '',
      className: p.team?.className ?? '',
      coverKey: p.images[0]?.key ?? null,
      votes: validByProduct.get(p.id) ?? 0,
    })),
  );

  const zoneName = new Map(zones.map((z) => [z.id, z.name]));
  const byZone = zones.map((z) => ({
    zoneId: z.id as string | null,
    name: z.name,
    votes: zoneGroups.find((g) => g.zoneId === z.id)?._count._all ?? 0,
  }));
  const unassigned = zoneGroups.find((g) => g.zoneId === null || !zoneName.has(g.zoneId));
  if (unassigned) byZone.push({ zoneId: null, name: 'Chưa gán giáo khu', votes: unassigned._count._all });

  const issued = tokenGroups.reduce((s, g) => s + g._count._all, 0);
  return {
    totals: {
      issued,
      used: tokenCount('USED'),
      remaining: tokenCount('ACTIVE'),
      revoked: tokenCount('REVOKED'),
      validVotes,
      invalidVotes,
    },
    ranking,
    byZone,
    updatedAt: new Date().toISOString(),
  };
}

/** Cache 5 giây: hàng nghìn client polling chỉ tạo khoảng 1 truy vấn mỗi 5 giây. */
export function getResults(contestId: string): Promise<Results> {
  return cached(`r:${contestId}`, 5_000, () => computeResults(contestId));
}

// created_at là `timestamp` (không múi giờ) chứa giờ UTC: phải gắn UTC trước rồi mới đổi sang giờ VN.
export async function getVotesByDay(contestId: string) {
  const rows = await prisma.$queryRaw<{ day: Date; votes: bigint }[]>`
    SELECT date_trunc('day', (created_at AT TIME ZONE 'UTC') AT TIME ZONE 'Asia/Ho_Chi_Minh') AS day, count(*)::bigint AS votes
    FROM votes
    WHERE contest_id = ${contestId} AND status = 'VALID' AND deleted_at IS NULL
    GROUP BY 1 ORDER BY 1`;
  return rows.map((r) => ({ day: r.day.toISOString().slice(0, 10), votes: Number(r.votes) }));
}

export async function getVotesByHour(contestId: string) {
  const rows = await prisma.$queryRaw<{ hour: number; votes: bigint }[]>`
    SELECT extract(hour FROM (created_at AT TIME ZONE 'UTC') AT TIME ZONE 'Asia/Ho_Chi_Minh')::int AS hour, count(*)::bigint AS votes
    FROM votes
    WHERE contest_id = ${contestId} AND status = 'VALID' AND deleted_at IS NULL
    GROUP BY 1 ORDER BY 1`;
  return rows.map((r) => ({ hour: r.hour, votes: Number(r.votes) }));
}

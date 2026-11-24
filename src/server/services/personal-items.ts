import 'server-only';
import { parseDetails } from '@/domain/personal-item';
import { cached } from '../cache';
import { prisma } from '../db';

const TTL = 30_000;

/** Vật phẩm đang hiển thị trên trang /vat-pham-ca-nhan (cache bộ nhớ, xóa bằng invalidatePublic). */
export function listPublicPersonalItems() {
  return cached('c:personal-items', TTL, async () => {
    const items = await prisma.personalItem.findMany({
      where: { isActive: true, deletedAt: null },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      include: {
        images: {
          where: { deletedAt: null },
          orderBy: { sortOrder: 'asc' },
          select: { key: true, width: true, height: true, blurDataUrl: true, isMain: true, sortOrder: true },
        },
      },
    });
    return items.map((i) => ({
      id: i.id,
      name: i.name,
      maker: i.maker,
      meaning: i.meaning,
      details: parseDetails(i.details),
      images: i.images.map((img) => ({ ...img, alt: i.name })),
    }));
  });
}

export type PublicPersonalItem = Awaited<ReturnType<typeof listPublicPersonalItems>>[number];

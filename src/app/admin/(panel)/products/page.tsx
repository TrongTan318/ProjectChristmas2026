import Link from 'next/link';
import { Badge, PageHeader, Table, btn } from '@/components/admin/ui';
import { formatNumber } from '@/lib/format';
import { mediaUrl } from '@/lib/media';
import { requireAdmin } from '@/server/auth';
import { requireActiveContest } from '@/server/contest';
import { prisma } from '@/server/db';

export default async function ProductsPage() {
  await requireAdmin();
  const contest = await requireActiveContest();
  const products = await prisma.product.findMany({
    where: { contestId: contest.id, deletedAt: null },
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    include: {
      team: true,
      images: { where: { deletedAt: null }, orderBy: [{ isCover: 'desc' }, { sortOrder: 'asc' }], take: 1 },
      _count: { select: { images: { where: { deletedAt: null } }, videos: { where: { deletedAt: null } } } },
    },
  });

  return (
    <div>
      <PageHeader
        title="Sản phẩm"
        description={`${products.length} sản phẩm`}
        actions={<Link href="/admin/products/new" className={btn.primary}>+ Thêm sản phẩm</Link>}
      />
      <Table>
        <thead>
          <tr>
            <th>Ảnh</th>
            <th>Tên sản phẩm</th>
            <th>Đội / Lớp</th>
            <th>Media</th>
            <th>Lượt xem</th>
            <th>Trạng thái</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p.id}>
              <td>
                {p.images[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={mediaUrl(p.images[0].key, 400)} alt="" className="h-12 w-16 rounded object-cover" />
                ) : (
                  <div className="h-12 w-16 rounded bg-zinc-200" />
                )}
              </td>
              <td>
                <Link href={`/admin/products/${p.id}`} className="font-medium text-burgundy hover:underline">{p.name}</Link>
                {p.isFeatured && <span className="ml-2 text-amber-500" title="Nổi bật">★</span>}
              </td>
              <td className="text-zinc-600">{p.team ? `${p.team.name} · ${p.team.className}` : '—'}</td>
              <td className="text-zinc-600">{p._count.images} ảnh · {p._count.videos} video</td>
              <td className="tabular-nums">{formatNumber(p.viewCount)}</td>
              <td>{p.status === 'PUBLISHED' ? <Badge tone="green">Đã xuất bản</Badge> : <Badge tone="amber">Nháp</Badge>}</td>
            </tr>
          ))}
          {products.length === 0 && (
            <tr>
              <td colSpan={6} className="py-8 text-center text-zinc-500">Chưa có sản phẩm. Hãy tạo đội trước, rồi thêm sản phẩm.</td>
            </tr>
          )}
        </tbody>
      </Table>
    </div>
  );
}

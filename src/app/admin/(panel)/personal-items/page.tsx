import Link from 'next/link';
import { Badge, Card, PageHeader, btn } from '@/components/admin/ui';
import { pickSlots } from '@/domain/personal-item';
import { mediaUrl } from '@/lib/media';
import { requireAdmin } from '@/server/auth';
import { prisma } from '@/server/db';
import { ItemForm } from './ItemForm';
import { MoveButtons } from './MoveButtons';

/** Vật phẩm cá nhân: trang trưng bày riêng, không bình chọn, không gắn cuộc thi hay lớp. */
export default async function PersonalItemsPage() {
  await requireAdmin();
  const items = await prisma.personalItem.findMany({
    where: { deletedAt: null },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    include: { images: { where: { deletedAt: null }, select: { key: true, isMain: true, sortOrder: true } } },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Vật phẩm cá nhân"
        description="Trang trưng bày riêng (/vat-pham-ca-nhan): không bình chọn, không gắn với lớp hay cuộc thi."
        actions={<Link href="/vat-pham-ca-nhan" target="_blank" className={btn.secondary}>Xem trang ↗</Link>}
      />

      <Card title="Thêm vật phẩm">
        <ItemForm />
      </Card>

      <Card title={`Danh sách (${items.length})`}>
        {items.length === 0 ? (
          <p className="text-sm text-zinc-500">Chưa có vật phẩm nào.</p>
        ) : (
          <ul className="divide-y divide-zinc-100">
            {items.map((it, i) => {
              const main = pickSlots(it.images).main;
              return (
                <li key={it.id} className="flex flex-wrap items-center gap-3 py-3">
                  <MoveButtons id={it.id} first={i === 0} last={i === items.length - 1} />
                  {main ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={mediaUrl(main.key, 400)} alt="" className="h-14 w-11 rounded object-cover ring-1 ring-zinc-200" />
                  ) : (
                    <span className="flex h-14 w-11 items-center justify-center rounded bg-zinc-100 text-xs text-zinc-400">—</span>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{it.name}</p>
                    <p className="truncate text-sm text-zinc-500">
                      {it.maker || 'Chưa ghi người làm'} · {it.images.length} ảnh
                    </p>
                  </div>
                  {!it.isActive && <Badge tone="zinc">Đang ẩn</Badge>}
                  <Link href={`/admin/personal-items/${it.id}`} className={btn.secondary}>Sửa / ảnh</Link>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}

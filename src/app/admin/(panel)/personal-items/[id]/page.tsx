import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ActionForm, SubmitButton } from '@/components/admin/ActionForm';
import { Card, PageHeader, btn } from '@/components/admin/ui';
import { MAX_ITEM_IMAGES, parseDetails } from '@/domain/personal-item';
import { requireAdmin } from '@/server/auth';
import { prisma } from '@/server/db';
import { deleteItem } from '../actions';
import { ItemForm } from '../ItemForm';
import { ItemImageManager } from './ItemImageManager';

export default async function EditPersonalItemPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const item = await prisma.personalItem.findFirst({
    where: { id, deletedAt: null },
    include: { images: { where: { deletedAt: null }, orderBy: { sortOrder: 'asc' }, select: { id: true, key: true, isMain: true } } },
  });
  if (!item) notFound();

  return (
    <div className="space-y-6">
      <PageHeader
        title={item.name}
        description="Vật phẩm cá nhân"
        actions={
          <>
            <Link href="/admin/personal-items" className={btn.secondary}>← Danh sách</Link>
            <Link href="/vat-pham-ca-nhan" target="_blank" className={btn.secondary}>Xem trang ↗</Link>
          </>
        }
      />

      <Card title="Thông tin">
        <ItemForm
          item={{ id: item.id, name: item.name, maker: item.maker, meaning: item.meaning, details: parseDetails(item.details), isActive: item.isActive }}
        />
      </Card>

      <Card title={`Ảnh (${item.images.length}/${MAX_ITEM_IMAGES})`}>
        <p className="mb-4 text-sm text-zinc-600">
          Mỗi vật phẩm 3 ảnh: <strong>★ ảnh đại diện</strong> (thẻ ở khung giữa), rồi theo thứ tự <strong>ảnh khung trên</strong> và{' '}
          <strong>ảnh khung dưới</strong> (hiện mờ làm nền, chữ đặt lên trên). Dùng nút ← → để đổi vị trí, ★ để chọn ảnh đại diện.
        </p>
        <ItemImageManager itemId={item.id} max={MAX_ITEM_IMAGES} images={item.images} />
      </Card>

      <Card title="Xóa vật phẩm">
        <ActionForm action={deleteItem} confirmMessage={`Xóa "${item.name}" và toàn bộ ảnh?`}>
          <input type="hidden" name="id" value={item.id} />
          <SubmitButton variant="danger">Xóa vật phẩm</SubmitButton>
        </ActionForm>
      </Card>
    </div>
  );
}

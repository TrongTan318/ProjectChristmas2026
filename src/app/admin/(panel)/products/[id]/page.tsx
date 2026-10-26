import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ActionForm, SubmitButton } from '@/components/admin/ActionForm';
import { Card, Checkbox, Field, Input, PageHeader, Select, Textarea, btn } from '@/components/admin/ui';
import { MAX_IMAGES_PER_PRODUCT } from '@/lib/limits';
import { requireAdmin } from '@/server/auth';
import { prisma } from '@/server/db';
import { addYoutubeVideo, deleteProduct, updateProduct } from '../actions';
import { ImageManager } from './ImageManager';
import { VideoManager } from './VideoManager';

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const product = await prisma.product.findFirst({
    where: { id, deletedAt: null },
    include: {
      team: true,
      images: { where: { deletedAt: null }, orderBy: { sortOrder: 'asc' } },
      videos: { where: { deletedAt: null }, orderBy: { sortOrder: 'asc' } },
    },
  });
  if (!product) notFound();

  return (
    <div className="space-y-6">
      <PageHeader
        title={product.name}
        description={product.team ? `${product.team.name} · ${product.team.className}` : undefined}
        actions={
          <>
            <Link href="/admin/products" className={btn.secondary}>← Danh sách</Link>
            {product.status === 'PUBLISHED' && (
              <Link href={`/trien-lam/${product.slug}`} target="_blank" className={btn.secondary}>Xem trên website ↗</Link>
            )}
          </>
        }
      />

      <Card title="Thông tin sản phẩm">
        <ActionForm action={updateProduct} className="space-y-4">
          <input type="hidden" name="id" value={product.id} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Tên sản phẩm *">
              <Input name="name" required maxLength={160} defaultValue={product.name} />
            </Field>
            <Field label="Đường dẫn (slug)" hint={`/trien-lam/${product.slug}`}>
              <Input name="slug" maxLength={80} defaultValue={product.slug} />
            </Field>
          </div>
          <Field label="Mô tả ngắn" hint="Tối đa 500 ký tự, hiển thị trên thẻ sản phẩm và khi chia sẻ">
            <Textarea name="shortDescription" rows={2} maxLength={500} defaultValue={product.shortDescription} />
          </Field>
          <Field label="Ý tưởng thiết kế" hint="Xuống dòng 2 lần để tách đoạn">
            <Textarea name="designIdea" rows={6} maxLength={10000} defaultValue={product.designIdea} />
          </Field>
          <Field label="Ý nghĩa tôn giáo">
            <Textarea name="religiousMeaning" rows={6} maxLength={10000} defaultValue={product.religiousMeaning} />
          </Field>
          <Field label="Thông điệp Giáng Sinh" hint="Dòng đầu tiên được trích dẫn nổi bật">
            <Textarea name="christmasMessage" rows={4} maxLength={5000} defaultValue={product.christmasMessage} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Trạng thái">
              <Select name="status" defaultValue={product.status}>
                <option value="DRAFT">Nháp (ẩn)</option>
                <option value="PUBLISHED">Xuất bản</option>
              </Select>
            </Field>
            <Field label="Thứ tự hiển thị">
              <Input name="sortOrder" type="number" min={0} defaultValue={product.sortOrder} />
            </Field>
          </div>
          <SubmitButton>Lưu sản phẩm</SubmitButton>
        </ActionForm>
      </Card>

      <Card title={`Album ảnh (${product.images.length}/${MAX_IMAGES_PER_PRODUCT})`}>
        <ImageManager
          productId={product.id}
          max={MAX_IMAGES_PER_PRODUCT}
          images={product.images.map((i) => ({ id: i.id, key: i.key, alt: i.alt, isCover: i.isCover }))}
        />
      </Card>

      <Card title="Video">
        <VideoManager
          productId={product.id}
          videos={product.videos.map((v) => ({ id: v.id, kind: v.kind, youtubeId: v.youtubeId, fileKey: v.fileKey, title: v.title }))}
        />
        <ActionForm action={addYoutubeVideo} resetOnSuccess className="mt-5 border-t border-zinc-100 pt-5">
          <input type="hidden" name="productId" value={product.id} />
          <p className="mb-3 text-sm font-medium">Thêm video YouTube</p>
          <div className="grid gap-3 sm:grid-cols-[2fr_1fr_auto] sm:items-end">
            <Field label="Link YouTube">
              <Input name="url" required placeholder="https://www.youtube.com/watch?v=..." />
            </Field>
            <Field label="Tiêu đề">
              <Input name="title" maxLength={200} />
            </Field>
            <SubmitButton>+ Thêm</SubmitButton>
          </div>
          <div className="mt-2">
            <Checkbox name="isIntro" label="Video giới thiệu (hiển thị đầu tiên)" />
          </div>
        </ActionForm>
      </Card>

      <Card title="Vùng nguy hiểm">
        <ActionForm action={deleteProduct} confirmMessage={`Xóa sản phẩm “${product.name}”? Thao tác này không thể hoàn tác.`}>
          <input type="hidden" name="id" value={product.id} />
          <p className="mb-3 text-sm text-zinc-600">Chỉ xóa được khi sản phẩm chưa có phiếu bầu.</p>
          <SubmitButton variant="danger">Xóa sản phẩm</SubmitButton>
        </ActionForm>
      </Card>
    </div>
  );
}

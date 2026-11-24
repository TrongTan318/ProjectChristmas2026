import { NextResponse, type NextRequest } from 'next/server';
import { MAX_ITEM_IMAGES } from '@/domain/personal-item';
import { audit } from '@/server/audit';
import { getCurrentAdmin } from '@/server/auth';
import { invalidatePublic } from '@/server/cache';
import { prisma } from '@/server/db';
import { ImageError, MAX_IMAGE_BYTES, processImage } from '@/server/images';
import { isSameOrigin } from '@/server/request';

/** Upload 1 ảnh vật phẩm cá nhân / request. Chỉ quản trị viên (getCurrentAdmin không nhận tài khoản lớp). */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: 'Yêu cầu không hợp lệ.' }, { status: 403 });
  const user = await getCurrentAdmin();
  if (!user) return NextResponse.json({ error: 'Phiên đăng nhập đã hết hạn.' }, { status: 401 });

  const { id } = await params;
  const item = await prisma.personalItem.findFirst({ where: { id, deletedAt: null } });
  if (!item) return NextResponse.json({ error: 'Không tìm thấy vật phẩm.' }, { status: 404 });

  const form = await request.formData().catch(() => null);
  const file = form?.get('file');
  if (!(file instanceof File)) return NextResponse.json({ error: 'Không có tệp ảnh.' }, { status: 400 });
  if (file.size > MAX_IMAGE_BYTES) return NextResponse.json({ error: 'Ảnh vượt quá 15MB.' }, { status: 413 });

  const [count, hasMain] = await Promise.all([
    prisma.personalItemImage.count({ where: { itemId: id, deletedAt: null } }),
    prisma.personalItemImage.count({ where: { itemId: id, isMain: true, deletedAt: null } }),
  ]);
  if (count >= MAX_ITEM_IMAGES) return NextResponse.json({ error: `Tối đa ${MAX_ITEM_IMAGES} ảnh mỗi vật phẩm.` }, { status: 400 });

  try {
    const processed = await processImage(Buffer.from(await file.arrayBuffer()), `personal/${id}`);
    const image = await prisma.personalItemImage.create({
      data: {
        itemId: id,
        key: processed.key,
        width: processed.width,
        height: processed.height,
        blurDataUrl: processed.blurDataUrl,
        isMain: hasMain === 0, // chưa có ảnh chính → ảnh đầu tiên tải lên
        sortOrder: count,
      },
    });
    await audit({ userId: user.id, action: 'personal_item.image_upload', entityType: 'PersonalItemImage', entityId: image.id, after: { itemId: id, key: image.key } });
    invalidatePublic();
    return NextResponse.json({ id: image.id });
  } catch (error) {
    if (error instanceof ImageError) return NextResponse.json({ error: error.message }, { status: 400 });
    console.error('[upload]', error);
    return NextResponse.json({ error: 'Không xử lý được ảnh.' }, { status: 500 });
  }
}

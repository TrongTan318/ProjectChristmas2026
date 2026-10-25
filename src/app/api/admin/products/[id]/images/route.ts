import { NextResponse, type NextRequest } from 'next/server';
import { MAX_IMAGES_PER_PRODUCT } from '@/lib/limits';
import { audit } from '@/server/audit';
import { getCurrentAdmin } from '@/server/auth';
import { invalidatePublic } from '@/server/cache';
import { prisma } from '@/server/db';
import { ImageError, MAX_IMAGE_BYTES, processImage } from '@/server/images';
import { isSameOrigin } from '@/server/request';

/** Upload 1 ảnh / request (client gửi tuần tự để hiện tiến độ và tránh request quá lớn). */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: 'Yêu cầu không hợp lệ.' }, { status: 403 });
  const user = await getCurrentAdmin();
  if (!user) return NextResponse.json({ error: 'Phiên đăng nhập đã hết hạn.' }, { status: 401 });

  const { id } = await params;
  const product = await prisma.product.findFirst({ where: { id, deletedAt: null } });
  if (!product) return NextResponse.json({ error: 'Không tìm thấy sản phẩm.' }, { status: 404 });

  const count = await prisma.productImage.count({ where: { productId: id, deletedAt: null } });
  if (count >= MAX_IMAGES_PER_PRODUCT) {
    return NextResponse.json({ error: `Tối đa ${MAX_IMAGES_PER_PRODUCT} ảnh mỗi sản phẩm.` }, { status: 400 });
  }

  const form = await request.formData().catch(() => null);
  const file = form?.get('file');
  if (!(file instanceof File)) return NextResponse.json({ error: 'Không có tệp ảnh.' }, { status: 400 });
  if (file.size > MAX_IMAGE_BYTES) return NextResponse.json({ error: 'Ảnh vượt quá 15MB.' }, { status: 413 });

  try {
    const processed = await processImage(Buffer.from(await file.arrayBuffer()), `products/${id}`);
    const image = await prisma.productImage.create({
      data: {
        productId: id,
        key: processed.key,
        width: processed.width,
        height: processed.height,
        blurDataUrl: processed.blurDataUrl,
        alt: '',
        isCover: count === 0,
        sortOrder: count,
      },
    });
    await audit({ userId: user.id, action: 'image.upload', entityType: 'ProductImage', entityId: image.id, after: { productId: id, key: image.key } });
    invalidatePublic();
    return NextResponse.json({ id: image.id });
  } catch (error) {
    if (error instanceof ImageError) return NextResponse.json({ error: error.message }, { status: 400 });
    console.error('[upload]', error);
    return NextResponse.json({ error: 'Không xử lý được ảnh.' }, { status: 500 });
  }
}

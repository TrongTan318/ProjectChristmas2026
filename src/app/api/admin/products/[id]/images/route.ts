import { NextResponse, type NextRequest } from 'next/server';
import { parseStage } from '@/domain/stage';
import { MAX_IMAGES_PER_STAGE } from '@/lib/limits';
import { audit } from '@/server/audit';
import { ForbiddenError, getCurrentUser, requireProductAccess, type SessionUser } from '@/server/auth';
import { invalidatePublic } from '@/server/cache';
import { prisma } from '@/server/db';
import { ImageError, MAX_IMAGE_BYTES, processImage } from '@/server/images';
import { isSameOrigin } from '@/server/request';

/** Upload 1 ảnh / request (client gửi tuần tự để hiện tiến độ và tránh request quá lớn). */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: 'Yêu cầu không hợp lệ.' }, { status: 403 });
  if (!(await getCurrentUser())) return NextResponse.json({ error: 'Phiên đăng nhập đã hết hạn.' }, { status: 401 });

  const { id } = await params;
  // Quản trị viên: mọi sản phẩm; tài khoản lớp: chỉ sản phẩm của lớp mình.
  let user: SessionUser;
  try {
    ({ user } = await requireProductAccess(id));
  } catch (error) {
    if (error instanceof ForbiddenError) return NextResponse.json({ error: error.message }, { status: 403 });
    throw error;
  }

  const form = await request.formData().catch(() => null);
  const file = form?.get('file');
  if (!(file instanceof File)) return NextResponse.json({ error: 'Không có tệp ảnh.' }, { status: 400 });
  if (file.size > MAX_IMAGE_BYTES) return NextResponse.json({ error: 'Ảnh vượt quá 15MB.' }, { status: 413 });

  // Mọi ảnh đều thuộc một giai đoạn (1–3), tải ở /admin/stages.
  const stage = parseStage(form?.get('stage'));
  if (!stage) return NextResponse.json({ error: 'Chọn giai đoạn (1–3) cho ảnh.' }, { status: 400 });
  const [count, hasCover] = await Promise.all([
    prisma.productImage.count({ where: { productId: id, stage, deletedAt: null } }),
    prisma.productImage.count({ where: { productId: id, isCover: true, deletedAt: null } }),
  ]);
  if (count >= MAX_IMAGES_PER_STAGE) {
    return NextResponse.json({ error: `Tối đa ${MAX_IMAGES_PER_STAGE} ảnh mỗi giai đoạn.` }, { status: 400 });
  }

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
        isCover: hasCover === 0, // đội chưa có ảnh đại diện → ảnh đầu tiên tải lên
        stage,
        sortOrder: count,
      },
    });
    await audit({ userId: user.id, action: 'image.upload', entityType: 'ProductImage', entityId: image.id, after: { productId: id, key: image.key, stage } });
    invalidatePublic();
    return NextResponse.json({ id: image.id });
  } catch (error) {
    if (error instanceof ImageError) return NextResponse.json({ error: error.message }, { status: 400 });
    console.error('[upload]', error);
    return NextResponse.json({ error: 'Không xử lý được ảnh.' }, { status: 500 });
  }
}

'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import type { ActionState } from '@/lib/action';
import { slugify } from '@/lib/format';
import { parseYoutubeId } from '@/lib/media';
import { bool, int, runAction, str, UserError } from '@/server/action';
import { audit } from '@/server/audit';
import { requireAdmin } from '@/server/auth';
import { invalidatePublic } from '@/server/cache';
import { requireActiveContest } from '@/server/contest';
import { prisma } from '@/server/db';
import { removeByKey } from '@/server/storage';

async function uniqueSlug(contestId: string, base: string, excludeId?: string) {
  const root = slugify(base) || 'hang-da';
  for (let i = 1; ; i++) {
    const slug = i === 1 ? root : `${root}-${i}`;
    const exists = await prisma.product.findFirst({ where: { contestId, slug, NOT: excludeId ? { id: excludeId } : undefined } });
    if (!exists) return slug;
  }
}

function refresh(productId?: string) {
  invalidatePublic();
  revalidatePath('/admin/products');
  if (productId) revalidatePath(`/admin/products/${productId}`);
}

export async function createProduct(_prev: ActionState, form: FormData): Promise<ActionState> {
  const result = await runAction(async () => {
    const user = await requireAdmin();
    const contest = await requireActiveContest();
    const teamId = str(form, 'teamId');
    const name = z.string().min(1, 'Nhập tên sản phẩm').max(160).parse(str(form, 'name'));
    const team = await prisma.team.findFirst({ where: { id: teamId, contestId: contest.id, deletedAt: null }, include: { product: true } });
    if (!team) throw new UserError('Chọn đội hợp lệ.');
    if (team.product) throw new UserError('Đội này đã có sản phẩm.');
    const product = await prisma.product.create({
      data: { contestId: contest.id, teamId, name, slug: await uniqueSlug(contest.id, name), sortOrder: team.sortOrder },
    });
    await audit({ userId: user.id, action: 'product.create', entityType: 'Product', entityId: product.id, after: product });
    refresh();
    return product.id;
  });
  if (result?.ok) redirect(`/admin/products/${result.message}`);
  return result;
}

const productSchema = z.object({
  name: z.string().min(1, 'Nhập tên sản phẩm').max(160),
  slug: z.string().max(80),
  shortDescription: z.string().max(500, 'Mô tả ngắn tối đa 500 ký tự'),
  designIdea: z.string().max(10000),
  religiousMeaning: z.string().max(10000),
  christmasMessage: z.string().max(5000),
  sortOrder: z.number().int().min(0).max(9999),
});

export async function updateProduct(_prev: ActionState, form: FormData) {
  return runAction(async () => {
    const user = await requireAdmin();
    const id = str(form, 'id');
    const before = await prisma.product.findFirst({ where: { id, deletedAt: null }, include: { _count: { select: { images: { where: { deletedAt: null } } } } } });
    if (!before) throw new UserError('Không tìm thấy sản phẩm.');
    const data = productSchema.parse({
      name: str(form, 'name'),
      slug: str(form, 'slug'),
      shortDescription: str(form, 'shortDescription'),
      designIdea: str(form, 'designIdea'),
      religiousMeaning: str(form, 'religiousMeaning'),
      christmasMessage: str(form, 'christmasMessage'),
      sortOrder: int(form, 'sortOrder'),
    });
    const publish = str(form, 'status') === 'PUBLISHED';
    if (publish && before._count.images === 0) throw new UserError('Cần ít nhất 1 ảnh trước khi xuất bản.');
    const product = await prisma.product.update({
      where: { id },
      data: {
        ...data,
        slug: await uniqueSlug(before.contestId, data.slug || data.name, id),
        status: publish ? 'PUBLISHED' : 'DRAFT',
      },
    });
    await audit({ userId: user.id, action: 'product.update', entityType: 'Product', entityId: id, before, after: product });
    refresh(id);
    return publish ? 'Đã lưu và xuất bản.' : 'Đã lưu bản nháp.';
  });
}

export async function deleteProduct(_prev: ActionState, form: FormData): Promise<ActionState> {
  const result = await runAction(async () => {
    const user = await requireAdmin();
    const id = str(form, 'id');
    const product = await prisma.product.findFirst({ where: { id, deletedAt: null }, include: { _count: { select: { votes: true } } } });
    if (!product) throw new UserError('Không tìm thấy sản phẩm.');
    if (product._count.votes > 0) throw new UserError('Sản phẩm đã có phiếu bầu, không thể xóa. Hãy chuyển về Nháp nếu cần ẩn.');
    await prisma.product.update({
      where: { id },
      data: { deletedAt: new Date(), teamId: null, status: 'DRAFT', slug: `${product.slug}-deleted-${Date.now()}` },
    });
    await audit({ userId: user.id, action: 'product.delete', entityType: 'Product', entityId: id, before: product });
    refresh();
  });
  if (result?.ok) redirect('/admin/products');
  return result;
}

// ===== Ảnh =====

async function loadImage(imageId: string) {
  const image = await prisma.productImage.findFirst({ where: { id: imageId, deletedAt: null } });
  if (!image) throw new Error('Không tìm thấy ảnh');
  return image;
}

export async function setCoverImage(imageId: string) {
  const user = await requireAdmin();
  const image = await loadImage(imageId);
  await prisma.$transaction([
    prisma.productImage.updateMany({ where: { productId: image.productId }, data: { isCover: false } }),
    prisma.productImage.update({ where: { id: imageId }, data: { isCover: true } }),
  ]);
  await audit({ userId: user.id, action: 'image.cover', entityType: 'ProductImage', entityId: imageId });
  refresh(image.productId);
}

export async function moveImage(imageId: string, direction: -1 | 1) {
  await requireAdmin();
  const image = await loadImage(imageId);
  const images = await prisma.productImage.findMany({ where: { productId: image.productId, deletedAt: null }, orderBy: { sortOrder: 'asc' } });
  const index = images.findIndex((i) => i.id === imageId);
  const target = index + direction;
  if (target < 0 || target >= images.length) return;
  [images[index], images[target]] = [images[target]!, images[index]!];
  await prisma.$transaction(images.map((img, i) => prisma.productImage.update({ where: { id: img.id }, data: { sortOrder: i } })));
  refresh(image.productId);
}

export async function updateImageAlt(imageId: string, form: FormData) {
  await requireAdmin();
  const image = await loadImage(imageId);
  await prisma.productImage.update({ where: { id: imageId }, data: { alt: str(form, 'alt').slice(0, 200) } });
  refresh(image.productId);
}

export async function deleteImage(imageId: string) {
  const user = await requireAdmin();
  const image = await loadImage(imageId);
  const product = await prisma.product.findUnique({ where: { id: image.productId }, include: { _count: { select: { images: { where: { deletedAt: null } } } } } });
  if (product?.status === 'PUBLISHED' && product._count.images <= 1) {
    throw new Error('Sản phẩm đang xuất bản cần ít nhất 1 ảnh.');
  }
  await prisma.productImage.update({ where: { id: imageId }, data: { deletedAt: new Date(), isCover: false } });
  await removeByKey(image.key);
  if (image.isCover) {
    const next = await prisma.productImage.findFirst({ where: { productId: image.productId, deletedAt: null }, orderBy: { sortOrder: 'asc' } });
    if (next) await prisma.productImage.update({ where: { id: next.id }, data: { isCover: true } });
  }
  await audit({ userId: user.id, action: 'image.delete', entityType: 'ProductImage', entityId: imageId, before: image });
  refresh(image.productId);
}

// ===== Video =====

export async function addYoutubeVideo(_prev: ActionState, form: FormData) {
  return runAction(async () => {
    const user = await requireAdmin();
    const productId = str(form, 'productId');
    const youtubeId = parseYoutubeId(str(form, 'url'));
    if (!youtubeId) throw new UserError('Link YouTube không hợp lệ.');
    const count = await prisma.productVideo.count({ where: { productId, deletedAt: null } });
    if (count >= 10) throw new UserError('Tối đa 10 video mỗi sản phẩm.');
    const video = await prisma.productVideo.create({
      data: { productId, kind: 'YOUTUBE', youtubeId, title: str(form, 'title').slice(0, 200), isIntro: bool(form, 'isIntro'), sortOrder: count },
    });
    await audit({ userId: user.id, action: 'video.create', entityType: 'ProductVideo', entityId: video.id, after: video });
    refresh(productId);
    return 'Đã thêm video.';
  });
}

export async function deleteVideo(videoId: string) {
  const user = await requireAdmin();
  const video = await prisma.productVideo.findFirst({ where: { id: videoId, deletedAt: null } });
  if (!video) return;
  await prisma.productVideo.update({ where: { id: videoId }, data: { deletedAt: new Date() } });
  if (video.fileKey) await removeByKey(video.fileKey);
  await audit({ userId: user.id, action: 'video.delete', entityType: 'ProductVideo', entityId: videoId, before: video });
  refresh(video.productId);
}

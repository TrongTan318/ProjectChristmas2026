'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { parseDetails } from '@/domain/personal-item';
import type { ActionState } from '@/lib/action';
import { bool, runAction, str, UserError } from '@/server/action';
import { audit } from '@/server/audit';
import { requireAdmin } from '@/server/auth';
import { invalidatePublic } from '@/server/cache';
import { prisma } from '@/server/db';
import { removeByKey } from '@/server/storage';

/** Vật phẩm cá nhân: chỉ quản trị viên (requireAdmin chặn tài khoản lớp). Không liên quan bình chọn/lớp. */

function refresh(itemId?: string) {
  invalidatePublic();
  revalidatePath('/admin/personal-items');
  if (itemId) revalidatePath(`/admin/personal-items/${itemId}`);
  revalidatePath('/vat-pham-ca-nhan');
}

const itemSchema = z.object({
  name: z.string().trim().min(1, 'Nhập tên vật phẩm').max(160, 'Tên tối đa 160 ký tự'),
  maker: z.string().trim().max(120, 'Tên người làm tối đa 120 ký tự'),
  meaning: z.string().trim().max(3000, 'Ý nghĩa tối đa 3000 ký tự'),
});

/** Các dòng "Tên mục – Nội dung" gửi lên dạng 2 danh sách song song. */
function detailsFromForm(form: FormData) {
  const labels = form.getAll('detailLabel');
  const values = form.getAll('detailValue');
  // Đối tượng thường (không phải interface) để khớp kiểu JSON của Prisma.
  return parseDetails(values.map((v, i) => ({ label: labels[i], value: v }))).map(({ label, value }) => ({ label, value }));
}

export async function saveItem(_prev: ActionState, form: FormData) {
  let createdId: string | null = null;
  const state = await runAction(async () => {
    const user = await requireAdmin();
    const id = str(form, 'id');
    const data = {
      ...itemSchema.parse({ name: str(form, 'name'), maker: str(form, 'maker'), meaning: str(form, 'meaning') }),
      details: detailsFromForm(form),
      isActive: bool(form, 'isActive'),
    };
    if (id) {
      const before = await prisma.personalItem.findFirst({ where: { id, deletedAt: null } });
      if (!before) throw new UserError('Không tìm thấy vật phẩm.');
      await prisma.personalItem.update({ where: { id }, data });
      await audit({ userId: user.id, action: 'personal_item.update', entityType: 'PersonalItem', entityId: id, before, after: data });
      refresh(id);
      return 'Đã lưu.';
    }
    const last = await prisma.personalItem.findFirst({ where: { deletedAt: null }, orderBy: { sortOrder: 'desc' }, select: { sortOrder: true } });
    const item = await prisma.personalItem.create({ data: { ...data, sortOrder: (last?.sortOrder ?? -1) + 1 } });
    await audit({ userId: user.id, action: 'personal_item.create', entityType: 'PersonalItem', entityId: item.id, after: data });
    refresh();
    createdId = item.id;
  });
  // Tạo xong → sang trang sửa để tải ảnh.
  if (createdId) redirect(`/admin/personal-items/${createdId}`);
  return state;
}

export async function deleteItem(_prev: ActionState, form: FormData) {
  let deleted = false;
  const state = await runAction(async () => {
    const user = await requireAdmin();
    const id = str(form, 'id');
    const item = await prisma.personalItem.findFirst({ where: { id, deletedAt: null }, include: { images: { where: { deletedAt: null } } } });
    if (!item) throw new UserError('Không tìm thấy vật phẩm.');
    const now = new Date();
    await prisma.$transaction([
      prisma.personalItemImage.updateMany({ where: { itemId: id, deletedAt: null }, data: { deletedAt: now } }),
      prisma.personalItem.update({ where: { id }, data: { deletedAt: now, isActive: false } }),
    ]);
    for (const img of item.images) await removeByKey(img.key);
    await audit({ userId: user.id, action: 'personal_item.delete', entityType: 'PersonalItem', entityId: id, before: { name: item.name, images: item.images.length } });
    refresh();
    deleted = true;
  });
  if (deleted) redirect('/admin/personal-items');
  return state;
}

export async function moveItem(id: string, direction: -1 | 1) {
  await requireAdmin();
  if (direction !== -1 && direction !== 1) return;
  const items = await prisma.personalItem.findMany({ where: { deletedAt: null }, orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }] });
  const index = items.findIndex((i) => i.id === String(id));
  const target = index + direction;
  if (index < 0 || target < 0 || target >= items.length) return;
  [items[index], items[target]] = [items[target]!, items[index]!];
  await prisma.$transaction(items.map((it, i) => prisma.personalItem.update({ where: { id: it.id }, data: { sortOrder: i } })));
  refresh();
}

// ===== Ảnh =====

async function loadImage(imageId: string) {
  const user = await requireAdmin();
  const image = await prisma.personalItemImage.findFirst({ where: { id: String(imageId), deletedAt: null } });
  if (!image) throw new Error('Không tìm thấy ảnh');
  return { user, image };
}

export async function setMainImage(imageId: string) {
  const { user, image } = await loadImage(imageId);
  await prisma.$transaction([
    prisma.personalItemImage.updateMany({ where: { itemId: image.itemId }, data: { isMain: false } }),
    prisma.personalItemImage.update({ where: { id: image.id }, data: { isMain: true } }),
  ]);
  await audit({ userId: user.id, action: 'personal_item.image_main', entityType: 'PersonalItemImage', entityId: image.id });
  refresh(image.itemId);
}

export async function moveItemImage(imageId: string, direction: -1 | 1) {
  if (direction !== -1 && direction !== 1) return;
  const { image } = await loadImage(imageId);
  const images = await prisma.personalItemImage.findMany({ where: { itemId: image.itemId, deletedAt: null }, orderBy: { sortOrder: 'asc' } });
  const index = images.findIndex((i) => i.id === image.id);
  const target = index + direction;
  if (target < 0 || target >= images.length) return;
  [images[index], images[target]] = [images[target]!, images[index]!];
  await prisma.$transaction(images.map((img, i) => prisma.personalItemImage.update({ where: { id: img.id }, data: { sortOrder: i } })));
  refresh(image.itemId);
}

export async function deleteItemImage(imageId: string) {
  const { user, image } = await loadImage(imageId);
  await prisma.personalItemImage.update({ where: { id: image.id }, data: { deletedAt: new Date(), isMain: false } });
  await removeByKey(image.key);
  if (image.isMain) {
    const next = await prisma.personalItemImage.findFirst({ where: { itemId: image.itemId, deletedAt: null }, orderBy: { sortOrder: 'asc' } });
    if (next) await prisma.personalItemImage.update({ where: { id: next.id }, data: { isMain: true } });
  }
  await audit({ userId: user.id, action: 'personal_item.image_delete', entityType: 'PersonalItemImage', entityId: image.id, before: image });
  refresh(image.itemId);
}

'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { mergeStageConfig, STAGE_LAYOUTS, STAGE_NOTE_MAX, STAGE_TITLE_MAX, STAGES } from '@/domain/stage';
import type { ActionState } from '@/lib/action';
import { bool, runAction, str } from '@/server/action';
import { audit } from '@/server/audit';
import { requireProductAccess } from '@/server/auth';
import { invalidatePublic } from '@/server/cache';
import { prisma } from '@/server/db';

const stageSchema = z.object({
  title: z.string().trim().max(STAGE_TITLE_MAX, `Tên giai đoạn tối đa ${STAGE_TITLE_MAX} ký tự`),
  note: z.string().trim().max(STAGE_NOTE_MAX, `Mô tả giai đoạn tối đa ${STAGE_NOTE_MAX} ký tự`),
  enabled: z.boolean(),
  layout: z.enum(STAGE_LAYOUTS, { message: 'Kiểu khung không hợp lệ' }),
});

/**
 * Tên / mô tả / ẩn-hiện / kiểu khung 3 giai đoạn của một lớp (ghi đè mặc định ở Cài đặt).
 * Ẩn giai đoạn chỉ ẩn với khách, ảnh vẫn giữ nguyên và bật lại được.
 */
export async function updateStageConfig(_prev: ActionState, form: FormData) {
  return runAction(async () => {
    const productId = str(form, 'productId');
    const { user, product } = await requireProductAccess(productId);
    const config = Object.fromEntries(
      STAGES.map((s) => [
        String(s),
        stageSchema.parse({ title: str(form, `title${s}`), note: str(form, `note${s}`), enabled: bool(form, `enabled${s}`), layout: str(form, `layout${s}`) || 'slideshow' }),
      ]),
    );
    // Gộp vào cấu hình cũ để không làm mất phần khung ảnh đẹp.
    const stageConfig = mergeStageConfig(product.stageConfig, config) as Prisma.InputJsonObject;
    await prisma.product.update({ where: { id: product.id }, data: { stageConfig } });
    await audit({
      userId: user.id,
      action: 'stage.config',
      entityType: 'Product',
      entityId: product.id,
      before: { stageConfig: product.stageConfig },
      after: { stageConfig },
    });
    invalidatePublic();
    revalidatePath('/admin/stages');
    revalidatePath(`/trien-lam/${product.slug}`);
    return 'Đã lưu giai đoạn và kiểu khung.';
  });
}

/** Kiểu khung + ẩn/hiện của khung ảnh đẹp (♥) đầu trang chi tiết đội. */
export async function updateFeaturedConfig(_prev: ActionState, form: FormData) {
  return runAction(async () => {
    const { user, product } = await requireProductAccess(str(form, 'productId'));
    const featured = z
      .object({ layout: z.enum(STAGE_LAYOUTS, { message: 'Kiểu khung không hợp lệ' }), enabled: z.boolean() })
      .parse({ layout: str(form, 'featuredLayout') || 'slideshow', enabled: bool(form, 'featuredEnabled') });
    const stageConfig = mergeStageConfig(product.stageConfig, { featured }) as Prisma.InputJsonObject;
    await prisma.product.update({ where: { id: product.id }, data: { stageConfig } });
    await audit({ userId: user.id, action: 'stage.featured_config', entityType: 'Product', entityId: product.id, after: { featured } });
    invalidatePublic();
    revalidatePath('/admin/stages');
    revalidatePath(`/trien-lam/${product.slug}`);
    return 'Đã lưu khung ảnh đẹp.';
  });
}

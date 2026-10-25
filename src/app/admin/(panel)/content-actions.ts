'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import type { ActionState } from '@/lib/action';
import { slugify } from '@/lib/format';
import { bool, int, runAction, str, UserError } from '@/server/action';
import { audit } from '@/server/audit';
import { requireAdmin } from '@/server/auth';
import { invalidatePublic } from '@/server/cache';
import { requireActiveContest } from '@/server/contest';
import { prisma } from '@/server/db';

const imageKey = z
  .string()
  .regex(/^(content|products\/[\w-]+)\/[0-9a-f-]{36}$/, 'Ảnh không hợp lệ')
  .or(z.literal(''))
  .transform((v) => v || null);

const safeUrl = z
  .string()
  .max(300)
  .refine((v) => v === '' || v.startsWith('/') || /^https?:\/\//.test(v), 'Liên kết phải bắt đầu bằng / hoặc https://');

function done(path: string) {
  invalidatePublic();
  revalidatePath(path);
}

// ===== Banner =====
const bannerSchema = z.object({
  title: z.string().trim().min(1, 'Nhập tiêu đề').max(200),
  subtitle: z.string().max(400),
  imageKey,
  ctaLabel: z.string().max(60),
  ctaUrl: safeUrl,
  sortOrder: z.number().int().min(0).max(999),
  isActive: z.boolean(),
});

export async function saveBanner(_prev: ActionState, form: FormData) {
  return runAction(async () => {
    const user = await requireAdmin();
    const contest = await requireActiveContest();
    const id = str(form, 'id');
    const data = bannerSchema.parse({
      title: str(form, 'title'),
      subtitle: str(form, 'subtitle'),
      imageKey: str(form, 'imageKey'),
      ctaLabel: str(form, 'ctaLabel'),
      ctaUrl: str(form, 'ctaUrl'),
      sortOrder: int(form, 'sortOrder'),
      isActive: bool(form, 'isActive'),
    });
    const banner = id
      ? await prisma.banner.update({ where: { id }, data })
      : await prisma.banner.create({ data: { ...data, contestId: contest.id } });
    await audit({ userId: user.id, action: id ? 'banner.update' : 'banner.create', entityType: 'Banner', entityId: banner.id, after: banner });
    done('/admin/banners');
    return 'Đã lưu banner.';
  });
}

// ===== Tin tức =====
const newsSchema = z.object({
  title: z.string().trim().min(1, 'Nhập tiêu đề').max(200),
  excerpt: z.string().max(500),
  content: z.string().max(30000),
  coverKey: imageKey,
  isPublished: z.boolean(),
});

export async function saveAnnouncement(_prev: ActionState, form: FormData) {
  return runAction(async () => {
    const user = await requireAdmin();
    const contest = await requireActiveContest();
    const id = str(form, 'id');
    const data = newsSchema.parse({
      title: str(form, 'title'),
      excerpt: str(form, 'excerpt'),
      content: str(form, 'content'),
      coverKey: str(form, 'coverKey'),
      isPublished: bool(form, 'isPublished'),
    });
    const existing = id ? await prisma.announcement.findFirst({ where: { id, deletedAt: null } }) : null;
    if (id && !existing) throw new UserError('Không tìm thấy tin.');
    let slug = existing?.slug;
    if (!slug) {
      const base = slugify(data.title) || 'tin-tuc';
      slug = base;
      for (let i = 2; await prisma.announcement.findFirst({ where: { contestId: contest.id, slug } }); i++) slug = `${base}-${i}`;
    }
    const publishedAt = data.isPublished ? (existing?.publishedAt ?? new Date()) : existing?.publishedAt ?? null;
    const item = existing
      ? await prisma.announcement.update({ where: { id }, data: { ...data, publishedAt } })
      : await prisma.announcement.create({ data: { ...data, slug, publishedAt, contestId: contest.id } });
    await audit({ userId: user.id, action: existing ? 'news.update' : 'news.create', entityType: 'Announcement', entityId: item.id, after: item });
    done('/admin/news');
    return 'Đã lưu tin tức.';
  });
}

// ===== Nhà tài trợ =====
const sponsorSchema = z.object({
  name: z.string().trim().min(1, 'Nhập tên nhà tài trợ').max(160),
  logoKey: imageKey,
  url: safeUrl,
  tier: z.string().max(60),
  sortOrder: z.number().int().min(0).max(999),
  isActive: z.boolean(),
});

export async function saveSponsor(_prev: ActionState, form: FormData) {
  return runAction(async () => {
    const user = await requireAdmin();
    const contest = await requireActiveContest();
    const id = str(form, 'id');
    const parsed = sponsorSchema.parse({
      name: str(form, 'name'),
      logoKey: str(form, 'logoKey'),
      url: str(form, 'url'),
      tier: str(form, 'tier'),
      sortOrder: int(form, 'sortOrder'),
      isActive: bool(form, 'isActive'),
    });
    const data = { ...parsed, url: parsed.url || null };
    const sponsor = id
      ? await prisma.sponsor.update({ where: { id }, data })
      : await prisma.sponsor.create({ data: { ...data, contestId: contest.id } });
    await audit({ userId: user.id, action: id ? 'sponsor.update' : 'sponsor.create', entityType: 'Sponsor', entityId: sponsor.id, after: sponsor });
    done('/admin/sponsors');
    return 'Đã lưu nhà tài trợ.';
  });
}

// ===== Xóa (mềm) =====
const deletable = {
  banner: { path: '/admin/banners', run: (id: string) => prisma.banner.update({ where: { id }, data: { deletedAt: new Date() } }) },
  announcement: { path: '/admin/news', run: (id: string) => prisma.announcement.update({ where: { id }, data: { deletedAt: new Date(), slug: `deleted-${Date.now()}-${id}` } }) },
  sponsor: { path: '/admin/sponsors', run: (id: string) => prisma.sponsor.update({ where: { id }, data: { deletedAt: new Date() } }) },
} as const;

export async function deleteContent(_prev: ActionState, form: FormData) {
  return runAction(async () => {
    const user = await requireAdmin();
    const type = str(form, 'type') as keyof typeof deletable;
    const entry = deletable[type];
    if (!entry) throw new UserError('Loại nội dung không hợp lệ.');
    const id = str(form, 'id');
    await entry.run(id);
    await audit({ userId: user.id, action: `${type}.delete`, entityType: type, entityId: id });
    done(entry.path);
    return 'Đã xóa.';
  });
}

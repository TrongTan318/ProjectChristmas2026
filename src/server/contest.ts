import 'server-only';
import { cache } from 'react';
import { z } from 'zod';
import { prisma } from './db';
import { cached } from './cache';

export const getActiveContest = cache(() =>
  cached('c:contest', 10_000, () =>
    prisma.contest.findFirst({ where: { isActive: true, deletedAt: null }, orderBy: { createdAt: 'desc' } }),
  ),
);

export async function requireActiveContest() {
  const contest = await getActiveContest();
  if (!contest) throw new Error('Chưa có cuộc thi nào đang hoạt động. Hãy chạy seed dữ liệu.');
  return contest;
}

export type Contest = NonNullable<Awaited<ReturnType<typeof getActiveContest>>>;

export const siteSettingsSchema = z.object({
  heroTitle: z.string().max(200).default('Hội Thi Hang Đá Giáng Sinh 2026'),
  heroSubtitle: z.string().max(400).default('Triển lãm trực tuyến — Giáo xứ Bình Thới'),
  introTitle: z.string().max(200).default('Ngôi Lời đã làm người'),
  introBody: z
    .string()
    .max(5000)
    .default(
      'Mùa Giáng Sinh 2026, các em thiếu nhi Giáo xứ Bình Thới cùng nhau dựng nên những hang đá — nơi Hài Nhi Giêsu giáng trần trong khiêm hạ và yêu thương. Mời bạn bước vào bảo tàng trực tuyến, chiêm ngắm từng tác phẩm và bình chọn hang đá bạn yêu thích nhất.',
    ),
  introVideoUrl: z.string().max(300).default(''),
  contactPhone: z.string().max(50).default(''),
  contactEmail: z.string().max(120).default(''),
  address: z.string().max(300).default('Giáo xứ Bình Thới'),
  facebookUrl: z.string().max(300).default(''),
  youtubeUrl: z.string().max(300).default(''),
  voteHelp: z
    .string()
    .max(500)
    .default('Cần hỗ trợ? Vui lòng liên hệ bàn hướng dẫn của Ban tổ chức tại nhà thờ.'),
  effectsEnabled: z.boolean().default(true),
  rankingTopN: z.number().int().min(3).max(50).default(10),
  seoDescription: z
    .string()
    .max(300)
    .default('Triển lãm trực tuyến và bình chọn hang đá Giáng Sinh 2026 của thiếu nhi Giáo xứ Bình Thới.'),
});

export type SiteSettings = z.infer<typeof siteSettingsSchema>;
export const SITE_SETTINGS_KEY = 'site';

export const getSiteSettings = cache(async (contestId: string): Promise<SiteSettings> =>
  cached(`c:settings:${contestId}`, 30_000, async () => {
    const row = await prisma.setting.findUnique({
      where: { contestId_key: { contestId, key: SITE_SETTINGS_KEY } },
    });
    const parsed = siteSettingsSchema.safeParse(row?.value ?? {});
    return parsed.success ? parsed.data : siteSettingsSchema.parse({});
  }),
);

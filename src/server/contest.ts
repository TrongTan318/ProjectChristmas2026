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
  /** Ảnh nền trang chủ (chỉ đổi nền, không đổi chữ). Banner có ảnh riêng thì ưu tiên ảnh banner. */
  heroImageKey: z
    .string()
    .regex(/^content\/[0-9a-f-]{36}$/, 'Ảnh nền không hợp lệ')
    .or(z.literal(''))
    .default(''),
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
  /** Tên + mô tả ngắn của 3 khung ảnh giai đoạn trên trang chi tiết đội (áp dụng cho mọi đội). */
  stage1Title: z.string().trim().max(80).default('Giai đoạn 1'),
  stage1Note: z.string().trim().max(200).default(''),
  stage2Title: z.string().trim().max(80).default('Giai đoạn 2'),
  stage2Note: z.string().trim().max(200).default(''),
  stage3Title: z.string().trim().max(80).default('Giai đoạn 3'),
  stage3Note: z.string().trim().max(200).default(''),
  /** Bật/tắt từng giai đoạn trên trang công khai (admin vẫn tải ảnh được khi tắt). */
  stage1Enabled: z.boolean().default(true),
  stage2Enabled: z.boolean().default(true),
  stage3Enabled: z.boolean().default(true),
  effectsEnabled: z.boolean().default(true),
  rankingTopN: z.number().int().min(3).max(50).default(10),
  seoDescription: z
    .string()
    .max(300)
    .default('Triển lãm trực tuyến và bình chọn hang đá Giáng Sinh 2026 của thiếu nhi Giáo xứ Bình Thới.'),
});

export type SiteSettings = z.infer<typeof siteSettingsSchema>;

/** Tên + mô tả + bật/tắt 3 giai đoạn (thứ tự 1 → 3); tên để trống thì dùng "Giai đoạn N". */
export function stageLabels(s: SiteSettings) {
  return [
    { stage: 1 as const, title: s.stage1Title || 'Giai đoạn 1', note: s.stage1Note, enabled: s.stage1Enabled },
    { stage: 2 as const, title: s.stage2Title || 'Giai đoạn 2', note: s.stage2Note, enabled: s.stage2Enabled },
    { stage: 3 as const, title: s.stage3Title || 'Giai đoạn 3', note: s.stage3Note, enabled: s.stage3Enabled },
  ];
}
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

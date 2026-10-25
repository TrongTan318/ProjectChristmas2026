'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import type { ActionState } from '@/lib/action';
import { fromLocalInput } from '@/lib/format';
import { bool, int, runAction, str, UserError } from '@/server/action';
import { audit } from '@/server/audit';
import { requireAdmin, requireSuperAdminWithPassword } from '@/server/auth';
import { invalidatePublic } from '@/server/cache';
import { requireActiveContest, SITE_SETTINGS_KEY, siteSettingsSchema } from '@/server/contest';
import { prisma } from '@/server/db';

function done() {
  invalidatePublic();
  revalidatePath('/admin', 'layout');
}

/** Mở / khóa bình chọn ngay lập tức. */
export async function setVotingStatus(_prev: ActionState, form: FormData) {
  return runAction(async () => {
    const user = await requireSuperAdminWithPassword(form.get('password'));
    const contest = await requireActiveContest();
    const status = str(form, 'status') === 'OPEN' ? 'OPEN' : 'LOCKED';
    await prisma.contest.update({ where: { id: contest.id }, data: { votingStatus: status } });
    await audit({ userId: user.id, action: status === 'OPEN' ? 'voting.open' : 'voting.lock', entityType: 'Contest', entityId: contest.id, before: { votingStatus: contest.votingStatus }, after: { votingStatus: status, reason: str(form, 'reason') } });
    done();
    return status === 'OPEN' ? 'Đã MỞ bình chọn.' : 'Đã KHÓA bình chọn.';
  });
}

export async function setResultsVisibility(_prev: ActionState, form: FormData) {
  return runAction(async () => {
    const user = await requireSuperAdminWithPassword(form.get('password'));
    const contest = await requireActiveContest();
    const data = { resultsPublic: bool(form, 'resultsPublic'), resultsRealtime: bool(form, 'resultsRealtime') };
    await prisma.contest.update({ where: { id: contest.id }, data });
    await audit({ userId: user.id, action: 'results.visibility', entityType: 'Contest', entityId: contest.id, before: { resultsPublic: contest.resultsPublic, resultsRealtime: contest.resultsRealtime }, after: data });
    done();
    return 'Đã cập nhật hiển thị kết quả.';
  });
}

const contestSchema = z
  .object({
    name: z.string().trim().min(1, 'Nhập tên cuộc thi').max(200),
    organizer: z.string().trim().min(1, 'Nhập đơn vị tổ chức').max(200),
    year: z.number().int().min(2000).max(2100),
    votingStartAt: z.date().nullable(),
    votingEndAt: z.date().nullable(),
  })
  .refine((v) => !v.votingStartAt || !v.votingEndAt || v.votingEndAt > v.votingStartAt, 'Thời gian đóng phải sau thời gian mở');

export async function updateContest(_prev: ActionState, form: FormData) {
  return runAction(async () => {
    const user = await requireSuperAdminWithPassword(form.get('password'));
    const contest = await requireActiveContest();
    const data = contestSchema.parse({
      name: str(form, 'name'),
      organizer: str(form, 'organizer'),
      year: int(form, 'year'),
      votingStartAt: fromLocalInput(str(form, 'votingStartAt')),
      votingEndAt: fromLocalInput(str(form, 'votingEndAt')),
    });
    const updated = await prisma.contest.update({ where: { id: contest.id }, data });
    await audit({ userId: user.id, action: 'contest.update', entityType: 'Contest', entityId: contest.id, before: contest, after: updated });
    done();
    return 'Đã lưu thông tin cuộc thi.';
  });
}

export async function updateSiteSettings(_prev: ActionState, form: FormData) {
  return runAction(async () => {
    const user = await requireAdmin();
    const contest = await requireActiveContest();
    const raw = {
      heroTitle: str(form, 'heroTitle'),
      heroSubtitle: str(form, 'heroSubtitle'),
      introTitle: str(form, 'introTitle'),
      introBody: str(form, 'introBody'),
      introVideoUrl: str(form, 'introVideoUrl'),
      contactPhone: str(form, 'contactPhone'),
      contactEmail: str(form, 'contactEmail'),
      address: str(form, 'address'),
      facebookUrl: str(form, 'facebookUrl'),
      youtubeUrl: str(form, 'youtubeUrl'),
      voteHelp: str(form, 'voteHelp'),
      effectsEnabled: bool(form, 'effectsEnabled'),
      rankingTopN: int(form, 'rankingTopN', 10),
      seoDescription: str(form, 'seoDescription'),
    };
    const value = siteSettingsSchema.parse(raw);
    for (const url of [value.facebookUrl, value.youtubeUrl, value.introVideoUrl]) {
      if (url && !/^https:\/\//.test(url)) throw new UserError('Các liên kết phải bắt đầu bằng https://');
    }
    await prisma.setting.upsert({
      where: { contestId_key: { contestId: contest.id, key: SITE_SETTINGS_KEY } },
      create: { contestId: contest.id, key: SITE_SETTINGS_KEY, value },
      update: { value },
    });
    await audit({ userId: user.id, action: 'settings.update', entityType: 'Setting', entityId: SITE_SETTINGS_KEY, after: value });
    done();
    return 'Đã lưu cài đặt website.';
  });
}

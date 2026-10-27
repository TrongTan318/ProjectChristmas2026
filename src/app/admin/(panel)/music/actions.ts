'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import type { ActionState } from '@/lib/action';
import { bool, int, runAction, str, UserError } from '@/server/action';
import { audit } from '@/server/audit';
import { requireAdmin } from '@/server/auth';
import { invalidatePublic } from '@/server/cache';
import { prisma } from '@/server/db';
import { removeByKey } from '@/server/storage';

function done() {
  invalidatePublic();
  revalidatePath('/admin/music');
}

const trackSchema = z.object({
  title: z.string().trim().min(1, 'Nhập tên bài').max(200),
  sortOrder: z.number().int().min(0).max(999),
  isActive: z.boolean(),
});

export async function updateMusicTrack(_prev: ActionState, form: FormData) {
  return runAction(async () => {
    const user = await requireAdmin();
    const id = str(form, 'id');
    const before = await prisma.musicTrack.findFirst({ where: { id, deletedAt: null } });
    if (!before) throw new UserError('Không tìm thấy bài nhạc.');
    const data = trackSchema.parse({ title: str(form, 'title'), sortOrder: int(form, 'sortOrder'), isActive: bool(form, 'isActive') });
    const after = await prisma.musicTrack.update({ where: { id }, data });
    await audit({ userId: user.id, action: 'music.update', entityType: 'MusicTrack', entityId: id, before, after });
    done();
    return 'Đã lưu bài nhạc.';
  });
}

export async function deleteMusicTrack(id: string) {
  const user = await requireAdmin();
  const track = await prisma.musicTrack.findFirst({ where: { id, deletedAt: null } });
  if (!track) return;
  await prisma.musicTrack.update({ where: { id }, data: { deletedAt: new Date() } });
  await removeByKey(track.fileKey);
  await audit({ userId: user.id, action: 'music.delete', entityType: 'MusicTrack', entityId: id, before: track });
  done();
}

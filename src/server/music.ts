import 'server-only';
import { fileUrl } from '@/lib/media';
import { cached } from './cache';
import { getActiveContest } from './contest';
import { prisma } from './db';

export interface MusicTrack {
  src: string;
  title: string;
}

/** Danh sách nhạc nền đang bật của cuộc thi hiện tại (quản lý ở /admin/music). */
export async function getMusicTracks(): Promise<MusicTrack[]> {
  const contest = await getActiveContest();
  if (!contest) return [];
  return cached(`c:music:${contest.id}`, 30_000, async () => {
    const rows = await prisma.musicTrack.findMany({
      where: { contestId: contest.id, isActive: true, deletedAt: null },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      select: { title: true, fileKey: true },
    });
    return rows.map((r) => ({ src: fileUrl(r.fileKey), title: r.title }));
  });
}

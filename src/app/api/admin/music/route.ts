import { randomUUID } from 'node:crypto';
import { createWriteStream } from 'node:fs';
import { open, rename, rm } from 'node:fs/promises';
import { NextResponse, type NextRequest } from 'next/server';
import { MAX_AUDIO_BYTES } from '@/lib/limits';
import { audit } from '@/server/audit';
import { getCurrentAdmin } from '@/server/auth';
import { invalidatePublic } from '@/server/cache';
import { requireActiveContest } from '@/server/contest';
import { prisma } from '@/server/db';
import { isSameOrigin } from '@/server/request';
import { ensureDirFor, resolveKey } from '@/server/storage';

/** Nhận diện định dạng âm thanh qua chữ ký đầu tệp (không tin đuôi tệp/Content-Type). */
function detectAudio(h: Buffer): 'mp3' | 'm4a' | 'ogg' | null {
  if (h.toString('ascii', 0, 3) === 'ID3') return 'mp3';
  if (h[0] === 0xff && (h[1] & 0xe0) === 0xe0) return 'mp3'; // MPEG frame sync
  if (h.toString('ascii', 4, 8) === 'ftyp') return 'm4a';
  if (h.toString('ascii', 0, 4) === 'OggS') return 'ogg';
  return null;
}

/** Upload nhạc nền: body là nội dung tệp (stream thẳng xuống đĩa). Tên bài ở query `title`. */
export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: 'Yêu cầu không hợp lệ.' }, { status: 403 });
  const user = await getCurrentAdmin();
  if (!user) return NextResponse.json({ error: 'Phiên đăng nhập đã hết hạn.' }, { status: 401 });
  const contest = await requireActiveContest();

  const declared = Number(request.headers.get('content-length') ?? 0);
  if (declared > MAX_AUDIO_BYTES) return NextResponse.json({ error: 'Tệp nhạc vượt quá 20MB.' }, { status: 413 });
  if (!request.body) return NextResponse.json({ error: 'Không có dữ liệu.' }, { status: 400 });

  const id = randomUUID();
  const tmp = resolveKey(`music/${id}.upload`);
  await ensureDirFor(tmp);

  let size = 0;
  let key: string;
  try {
    const out = createWriteStream(tmp);
    const reader = request.body.getReader();
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_AUDIO_BYTES) {
        await reader.cancel();
        throw new Error('too-large');
      }
      if (!out.write(value)) await new Promise<void>((r) => out.once('drain', () => r()));
    }
    await new Promise<void>((resolve, reject) => out.end((err?: Error | null) => (err ? reject(err) : resolve())));

    const fh = await open(tmp, 'r');
    const header = Buffer.alloc(12);
    await fh.read(header, 0, 12, 0);
    await fh.close();
    const ext = detectAudio(header);
    if (!ext) throw new Error('not-audio');
    key = `music/${id}.${ext}`;
    await rename(tmp, resolveKey(key));
  } catch (error) {
    await rm(tmp, { force: true });
    const msg = error instanceof Error && error.message === 'too-large' ? 'Tệp nhạc vượt quá 20MB.' : 'Tệp không phải nhạc MP3/M4A/OGG hợp lệ.';
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const title = (request.nextUrl.searchParams.get('title') ?? '').trim().slice(0, 200) || 'Nhạc Giáng Sinh';
  const count = await prisma.musicTrack.count({ where: { contestId: contest.id, deletedAt: null } });
  const track = await prisma.musicTrack.create({
    data: { contestId: contest.id, title, fileKey: key, sizeBytes: size, sortOrder: count },
  });
  await audit({ userId: user.id, action: 'music.upload', entityType: 'MusicTrack', entityId: track.id, after: { key, size, title } });
  invalidatePublic();
  return NextResponse.json({ id: track.id });
}

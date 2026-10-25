import { randomUUID } from 'node:crypto';
import { createWriteStream } from 'node:fs';
import { open, rm } from 'node:fs/promises';
import { NextResponse, type NextRequest } from 'next/server';
import { MAX_VIDEO_BYTES } from '@/lib/limits';
import { audit } from '@/server/audit';
import { getCurrentAdmin } from '@/server/auth';
import { invalidatePublic } from '@/server/cache';
import { prisma } from '@/server/db';
import { isSameOrigin } from '@/server/request';
import { ensureDirFor, resolveKey } from '@/server/storage';

/** Upload video giới thiệu MP4: body là nội dung tệp (stream thẳng xuống đĩa, không giữ trong RAM). */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: 'Yêu cầu không hợp lệ.' }, { status: 403 });
  const user = await getCurrentAdmin();
  if (!user) return NextResponse.json({ error: 'Phiên đăng nhập đã hết hạn.' }, { status: 401 });

  const { id } = await params;
  const product = await prisma.product.findFirst({ where: { id, deletedAt: null } });
  if (!product) return NextResponse.json({ error: 'Không tìm thấy sản phẩm.' }, { status: 404 });

  const declared = Number(request.headers.get('content-length') ?? 0);
  if (declared > MAX_VIDEO_BYTES) return NextResponse.json({ error: 'Video vượt quá 200MB.' }, { status: 413 });
  if (!request.body) return NextResponse.json({ error: 'Không có dữ liệu.' }, { status: 400 });

  const key = `videos/${id}/${randomUUID()}.mp4`;
  const file = resolveKey(key);
  await ensureDirFor(file);

  let size = 0;
  try {
    const out = createWriteStream(file);
    const reader = request.body.getReader();
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_VIDEO_BYTES) {
        await reader.cancel();
        throw new Error('too-large');
      }
      if (!out.write(value)) await new Promise<void>((r) => out.once('drain', () => r()));
    }
    await new Promise<void>((resolve, reject) => out.end((err?: Error | null) => (err ? reject(err) : resolve())));

    // Kiểm tra chữ ký MP4: byte 4–8 là "ftyp".
    const fh = await open(file, 'r');
    const header = Buffer.alloc(12);
    await fh.read(header, 0, 12, 0);
    await fh.close();
    if (header.toString('ascii', 4, 8) !== 'ftyp') throw new Error('not-mp4');
  } catch (error) {
    await rm(file, { force: true });
    const msg = error instanceof Error && error.message === 'too-large' ? 'Video vượt quá 200MB.' : 'Tệp không phải video MP4 hợp lệ.';
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const count = await prisma.productVideo.count({ where: { productId: id, deletedAt: null } });
  const title = (request.nextUrl.searchParams.get('title') ?? '').slice(0, 200);
  const video = await prisma.productVideo.create({
    data: { productId: id, kind: 'FILE', fileKey: key, title, isIntro: true, sortOrder: count },
  });
  await audit({ userId: user.id, action: 'video.upload', entityType: 'ProductVideo', entityId: video.id, after: { key, size } });
  invalidatePublic();
  return NextResponse.json({ id: video.id });
}

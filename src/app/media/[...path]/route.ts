import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import path from 'node:path';
import { Readable } from 'node:stream';
import type { NextRequest } from 'next/server';
import { resolveKey } from '@/server/storage';

const TYPES: Record<string, string> = {
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.mp4': 'video/mp4',
  '.mp3': 'audio/mpeg',
  '.m4a': 'audio/mp4',
  '.ogg': 'audio/ogg',
};

/**
 * Phục vụ media khi chạy dev / không có Nginx. Production: Nginx phục vụ thẳng
 * thư mục media ở /media/ nên route này không bị gọi.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path: parts } = await params;
  const key = parts.join('/');
  const type = TYPES[path.extname(key).toLowerCase()];
  if (!type || parts.some((p) => p.startsWith('.'))) return new Response('Not found', { status: 404 });

  let file: string;
  try {
    file = resolveKey(key);
  } catch {
    return new Response('Not found', { status: 404 });
  }

  const info = await stat(file).catch(() => null);
  if (!info?.isFile()) return new Response('Not found', { status: 404 });

  const headers = new Headers({
    'Content-Type': type,
    'Cache-Control': 'public, max-age=31536000, immutable',
    'Accept-Ranges': 'bytes',
    'X-Content-Type-Options': 'nosniff',
  });

  const range = request.headers.get('range')?.match(/^bytes=(\d*)-(\d*)$/);
  if (range) {
    const start = range[1] ? Number(range[1]) : 0;
    const end = range[2] ? Math.min(Number(range[2]), info.size - 1) : info.size - 1;
    if (start > end || start >= info.size) {
      return new Response(null, { status: 416, headers: { 'Content-Range': `bytes */${info.size}` } });
    }
    headers.set('Content-Range', `bytes ${start}-${end}/${info.size}`);
    headers.set('Content-Length', String(end - start + 1));
    const stream = Readable.toWeb(createReadStream(file, { start, end })) as ReadableStream;
    return new Response(stream, { status: 206, headers });
  }

  headers.set('Content-Length', String(info.size));
  return new Response(Readable.toWeb(createReadStream(file)) as ReadableStream, { headers });
}

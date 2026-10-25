import 'server-only';
import path from 'node:path';
import { mkdir, rm, readdir } from 'node:fs/promises';
import { env } from './env';

/** Thư mục gốc chứa media. Nginx phục vụ trực tiếp thư mục này ở /media/ khi production. */
export function mediaRoot(): string {
  return path.resolve(env().UPLOAD_DIR);
}

/** Đường dẫn tuyệt đối cho một khóa lưu trữ, chặn path traversal. */
export function resolveKey(key: string): string {
  const root = mediaRoot();
  const full = path.resolve(root, key);
  if (full !== root && !full.startsWith(root + path.sep)) throw new Error('Đường dẫn không hợp lệ');
  return full;
}

export async function ensureDirFor(filePath: string) {
  await mkdir(path.dirname(filePath), { recursive: true });
}

/** Xóa mọi file có tiền tố là khóa (ví dụ các biến thể -400/-800/-1600). */
export async function removeByKey(key: string) {
  const full = resolveKey(key);
  const dir = path.dirname(full);
  const base = path.basename(full);
  try {
    const files = await readdir(dir);
    await Promise.all(files.filter((f) => f.startsWith(base)).map((f) => rm(path.join(dir, f), { force: true })));
  } catch {
    // thư mục không tồn tại: bỏ qua
  }
}

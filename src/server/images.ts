import 'server-only';
import { randomUUID } from 'node:crypto';
import sharp from 'sharp';
import { detectHeif } from '@/lib/image-format';
import { IMAGE_SIZES } from '@/lib/media';
import { ensureDirFor, removeByKey, resolveKey } from './storage';

export const MAX_IMAGE_BYTES = 15 * 1024 * 1024;
const ALLOWED_FORMATS = new Set(['jpeg', 'png', 'webp', 'avif', 'heif', 'gif', 'tiff']);

export interface ProcessedImage {
  key: string;
  width: number;
  height: number;
  blurDataUrl: string;
}

export class ImageError extends Error {}

/** Lỗi ghi tệp phía máy chủ (sai quyền thư mục, hết dung lượng…), khác với lỗi do ảnh. */
function isStorageError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const code = (error as NodeJS.ErrnoException).code;
  if (code && ['EACCES', 'EPERM', 'ENOSPC', 'EROFS', 'EDQUOT', 'EMFILE'].includes(code)) return true;
  // sharp báo lỗi ghi tệp bằng thông điệp của libvips, không có mã lỗi.
  return /permission denied|no space left|read-only file system|unable to open .* for writ/i.test(error.message);
}

/**
 * Ảnh HEIC của iPhone (nén HEVC) → JPG, vì sharp bản dựng sẵn không đọc được HEVC.
 * Brand chung (mif1) có thể là AVIF: đổi thất bại thì để sharp tự đọc.
 */
async function decodeHeif(buffer: Buffer): Promise<Buffer> {
  const kind = detectHeif(buffer);
  if (!kind) return buffer;
  try {
    const { default: convert } = await import('heic-convert');
    return Buffer.from(await convert({ buffer, format: 'JPEG', quality: 0.92 }));
  } catch (error) {
    if (kind === 'generic') return buffer;
    console.error('[image] heic', error);
    throw new ImageError('Không đọc được ảnh HEIC này. Hãy mở ảnh trên điện thoại, lưu lại dạng JPG rồi tải lên.');
  }
}

/**
 * Giải mã lại toàn bộ ảnh bằng sharp (loại bỏ payload lạ), xoay theo EXIF,
 * bỏ toàn bộ metadata (kể cả GPS), sinh các kích thước WebP. Nhận cả ảnh HEIC (đổi sang JPG trước).
 */
export async function processImage(original: Buffer, folder: string): Promise<ProcessedImage> {
  if (original.byteLength > MAX_IMAGE_BYTES) throw new ImageError('Ảnh vượt quá 15MB.');
  const buffer = await decodeHeif(original);
  let meta: sharp.Metadata;
  try {
    meta = await sharp(buffer).metadata();
  } catch {
    throw new ImageError('Tệp không phải là ảnh hợp lệ.');
  }
  if (!meta.format || !ALLOWED_FORMATS.has(meta.format)) {
    throw new ImageError('Định dạng ảnh không được hỗ trợ (chỉ JPG, PNG, WebP, AVIF).');
  }
  if ((meta.width ?? 0) * (meta.height ?? 0) > 80_000_000) throw new ImageError('Ảnh quá lớn.');

  const key = `${folder}/${randomUUID()}`;
  const base = sharp(buffer, { failOn: 'error' }).rotate();

  try {
    for (const size of IMAGE_SIZES) {
      const file = resolveKey(`${key}-${size}.webp`);
      await ensureDirFor(file);
      await base
        .clone()
        .resize({ width: size, withoutEnlargement: true })
        .webp({ quality: size <= 400 ? 72 : 80 })
        .toFile(file);
    }
    const { info } = await base.clone().resize({ width: 1600, withoutEnlargement: true }).toBuffer({
      resolveWithObject: true,
    });
    const blur = await base.clone().resize(16).webp({ quality: 40 }).toBuffer();
    return {
      key,
      width: info.width,
      height: info.height,
      blurDataUrl: `data:image/webp;base64,${blur.toString('base64')}`,
    };
  } catch (error) {
    await removeByKey(key).catch(() => undefined);
    if (error instanceof ImageError) throw error;
    if (isStorageError(error)) {
      console.error('[image] storage', error);
      throw new ImageError('Máy chủ không lưu được ảnh (lỗi thư mục lưu trữ). Vui lòng báo quản trị viên.');
    }
    console.error('[image] process', error);
    throw new ImageError('Không xử lý được ảnh này (tệp có thể bị hỏng). Hãy thử lưu lại ảnh dạng JPG rồi tải lên.');
  }
}

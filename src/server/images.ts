import 'server-only';
import { randomUUID } from 'node:crypto';
import sharp from 'sharp';
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

/**
 * Giải mã lại toàn bộ ảnh bằng sharp (loại bỏ payload lạ), xoay theo EXIF,
 * bỏ toàn bộ metadata (kể cả GPS), sinh các kích thước WebP.
 */
export async function processImage(buffer: Buffer, folder: string): Promise<ProcessedImage> {
  if (buffer.byteLength > MAX_IMAGE_BYTES) throw new ImageError('Ảnh vượt quá 15MB.');
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
    await removeByKey(key);
    if (error instanceof ImageError) throw error;
    throw new ImageError('Không xử lý được ảnh này (ảnh HEIC của iPhone hãy chuyển sang JPG trước).');
  }
}

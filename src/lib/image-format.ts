/**
 * Nhận diện ảnh HEIC/HEIF (mặc định của iPhone) qua chữ ký đầu tệp — không tin đuôi tệp hay MIME
 * (ảnh HEIC chép từ iPhone đôi khi vẫn mang đuôi .JPG, và ngược lại).
 * Cấu trúc: [4 byte kích thước] "ftyp" [4 byte brand chính] …
 */

/** Brand chắc chắn nén HEVC → thư viện ảnh (sharp) không đọc được, phải đổi sang JPG trước. */
const HEVC_BRANDS = new Set(['heic', 'heix', 'hevc', 'hevx', 'heim', 'heis', 'hevm', 'hevs']);
/** Brand HEIF chung: có thể là HEVC (iPhone) hoặc AVIF. */
const GENERIC_BRANDS = new Set(['mif1', 'msf1']);

function ascii(buf: Uint8Array, start: number, end: number): string {
  return String.fromCharCode(...buf.subarray(start, end));
}

export type HeifKind = 'hevc' | 'generic' | null;

export function detectHeif(buf: Uint8Array): HeifKind {
  if (buf.length < 12 || ascii(buf, 4, 8) !== 'ftyp') return null;
  const brand = ascii(buf, 8, 12);
  if (HEVC_BRANDS.has(brand)) return 'hevc';
  if (GENERIC_BRANDS.has(brand)) return 'generic';
  return null;
}

/** Thuộc tính accept cho ô chọn ảnh (thêm đuôi .heic/.heif vì Windows thường không có MIME cho HEIC). */
export const IMAGE_ACCEPT = 'image/jpeg,image/png,image/webp,image/avif,image/heic,image/heif,.heic,.heif';

/**
 * Khung ảnh trình chiếu tự theo hình:
 * - Ảnh đủ lớn: khung lấy đúng tỉ lệ ảnh (dọc ra dọc, ngang ra ngang), không cắt.
 * - Ảnh nhỏ (rộng < FIT_MIN_WIDTH): giữ khung mặc định 4:3, ảnh nằm giữa không phóng to.
 */
export const FIT_MIN_WIDTH = 800;
export const DEFAULT_RATIO = 4 / 3;
/** Giới hạn tỉ lệ để ảnh quá dài/quá dẹt (ảnh panorama, chụp màn hình) không làm khung méo. */
export const MIN_RATIO = 9 / 16;
export const MAX_RATIO = 21 / 9;

export type Frame = { mode: 'fit'; ratio: number } | { mode: 'default'; ratio: number };

export function frameFor(image: { width: number; height: number }): Frame {
  const { width, height } = image;
  if (!(width > 0) || !(height > 0) || width < FIT_MIN_WIDTH) return { mode: 'default', ratio: DEFAULT_RATIO };
  const ratio = Math.min(MAX_RATIO, Math.max(MIN_RATIO, width / height));
  return { mode: 'fit', ratio };
}

/** Tỉ lệ ô ảnh trong các kiểu ghép (lưới, polaroid, tranh): đúng tỉ lệ ảnh, có giới hạn. */
export function tileRatio(image: { width: number; height: number }): number {
  if (!(image.width > 0) || !(image.height > 0)) return DEFAULT_RATIO;
  return Math.min(MAX_RATIO, Math.max(MIN_RATIO, image.width / image.height));
}

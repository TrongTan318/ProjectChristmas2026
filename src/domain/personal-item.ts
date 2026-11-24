/**
 * Vật phẩm cá nhân (trang trưng bày riêng) — logic thuần, không phụ thuộc Next/Prisma.
 */

/** Mỗi vật phẩm đúng 3 ảnh: đại diện (khung giữa), nền khung trên, nền khung dưới. */
export const MAX_ITEM_IMAGES = 3;
export const MAX_DETAIL_ROWS = 12;
export const DETAIL_LABEL_MAX = 40;
export const DETAIL_VALUE_MAX = 300;

export interface DetailRow {
  label: string;
  value: string;
}

/**
 * Đọc các dòng "Tên mục – Nội dung" (từ DB hoặc form): bỏ dòng trống/sai kiểu, cắt độ dài, tối đa 12 dòng.
 * Dòng chỉ có nội dung mà không có tên mục vẫn giữ (hiện như một ghi chú).
 */
export function parseDetails(raw: unknown): DetailRow[] {
  if (!Array.isArray(raw)) return [];
  const out: DetailRow[] = [];
  for (const row of raw) {
    if (!row || typeof row !== 'object' || Array.isArray(row)) continue;
    const r = row as Record<string, unknown>;
    const label = typeof r.label === 'string' ? r.label.trim().slice(0, DETAIL_LABEL_MAX) : '';
    const value = typeof r.value === 'string' ? r.value.trim().slice(0, DETAIL_VALUE_MAX) : '';
    if (!value) continue;
    out.push({ label, value });
    if (out.length >= MAX_DETAIL_ROWS) break;
  }
  return out;
}

export interface SlotImage {
  isMain: boolean;
  sortOrder: number;
}

/**
 * Chia ảnh vào 3 ô của trang trưng bày, theo thứ tự admin sắp xếp:
 * ảnh chính (★) → thẻ khung giữa; ảnh phụ thứ 1 → nền khung trên; thứ 2 → nền khung dưới.
 * Chưa đánh dấu ảnh chính thì dùng ảnh đầu tiên. Ảnh dư (dữ liệu cũ) bị bỏ qua.
 */
export function pickSlots<T extends SlotImage>(images: T[]) {
  const sorted = [...images].sort((a, b) => a.sortOrder - b.sortOrder);
  const main = sorted.find((i) => i.isMain) ?? sorted[0] ?? null;
  const extras = sorted.filter((i) => i !== main);
  return { main, top: extras[0] ?? null, bottom: extras[1] ?? null };
}

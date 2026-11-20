/**
 * Ảnh theo giai đoạn thực hiện hang đá (1 → 3).
 * Ảnh có `stage = null` là ảnh đại diện/ảnh chung (tải ở trang sửa sản phẩm).
 */
export const STAGES = [1, 2, 3] as const;
export type Stage = (typeof STAGES)[number];

/** Đọc giai đoạn từ form/query; trả `null` nếu trống hoặc không hợp lệ. */
export function parseStage(value: unknown): Stage | null {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  return (STAGES as readonly number[]).includes(n) ? (n as Stage) : null;
}

/** Gom ảnh theo giai đoạn, giữ thứ tự `sortOrder` trong từng giai đoạn; bỏ qua ảnh không có giai đoạn. */
export function groupByStage<T extends { stage: number | null; sortOrder: number }>(images: T[]): Record<Stage, T[]> {
  const out: Record<Stage, T[]> = { 1: [], 2: [], 3: [] };
  for (const img of images) {
    const stage = parseStage(img.stage);
    if (stage) out[stage].push(img);
  }
  for (const s of STAGES) out[s].sort((a, b) => a.sortOrder - b.sortOrder);
  return out;
}

/**
 * Chọn ảnh đại diện: ảnh được đánh dấu đại diện (ở bất kỳ giai đoạn nào) → ảnh chung đầu tiên
 * (dữ liệu cũ) → ảnh đầu tiên của giai đoạn mới nhất có ảnh.
 */
export function pickCover<T extends { stage: number | null; isCover: boolean; sortOrder: number }>(images: T[]): T | null {
  const marked = images.find((i) => i.isCover);
  if (marked) return marked;
  const general = images.filter((i) => i.stage === null).sort((a, b) => a.sortOrder - b.sortOrder);
  if (general[0]) return general[0];
  const byStage = groupByStage(images);
  for (const s of [...STAGES].reverse()) if (byStage[s][0]) return byStage[s][0];
  return null;
}

/** Giai đoạn mở sẵn trên trang đội: giai đoạn mới nhất có ảnh; chưa có ảnh nào thì giai đoạn mới nhất. */
export function defaultOpenStage(stages: { stage: Stage; count: number }[]): Stage | null {
  const sorted = [...stages].sort((a, b) => b.stage - a.stage);
  return (sorted.find((s) => s.count > 0) ?? sorted[0])?.stage ?? null;
}

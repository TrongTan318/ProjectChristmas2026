/**
 * Ảnh theo giai đoạn thực hiện hang đá (1 → 3).
 * Mọi ảnh thuộc một giai đoạn; `stage = null` chỉ còn ở dữ liệu cũ trước khi chuyển vào giai đoạn 1.
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

/** Kiểu khung hiển thị ảnh của một giai đoạn; mặc định Trình chiếu. */
export const STAGE_LAYOUTS = ['slideshow', 'polaroid', 'diamond', 'masonry', 'feature', 'museum'] as const;
export type StageLayout = (typeof STAGE_LAYOUTS)[number];
export const DEFAULT_LAYOUT: StageLayout = 'slideshow';

export const LAYOUT_INFO: Record<StageLayout, { name: string; hint: string; slots: number | null }> = {
  slideshow: { name: 'Trình chiếu', hint: '1 ảnh lớn, khung tự theo hình (mặc định)', slots: null },
  polaroid: { name: 'Polaroid rải', hint: 'Ảnh viền trắng xoay nghiêng, 5 ảnh đầu', slots: 5 },
  diamond: { name: 'Kim cương', hint: 'Ảnh 1 hình thoi ở giữa + 4 góc, 5 ảnh đầu (có cắt ảnh)', slots: 5 },
  masonry: { name: 'Lưới so le', hint: 'Mọi ảnh, giữ nguyên tỉ lệ', slots: null },
  feature: { name: 'Ảnh chính + phụ', hint: 'Ảnh 1 lớn + 4 ảnh nhỏ, 5 ảnh đầu', slots: 5 },
  museum: { name: 'Tranh bảo tàng', hint: 'Mọi ảnh trong khung vàng như treo tường', slots: null },
};

export function parseLayout(value: unknown): StageLayout {
  return (STAGE_LAYOUTS as readonly unknown[]).includes(value) ? (value as StageLayout) : DEFAULT_LAYOUT;
}

export interface StageLabel {
  stage: Stage;
  title: string;
  note: string;
  enabled: boolean;
  layout: StageLayout;
}

export const STAGE_TITLE_MAX = 80;
export const STAGE_NOTE_MAX = 200;

/**
 * Áp cấu hình riêng của lớp (`products.stage_config`) lên mặc định ở Cài đặt.
 * Dữ liệu lạ/sai kiểu bị bỏ qua, tên rỗng thì dùng tên mặc định.
 */
export function mergeStageLabels(
  defaults: (Omit<StageLabel, 'layout'> & { layout?: StageLayout })[],
  override: unknown,
): StageLabel[] {
  const source = override && typeof override === 'object' && !Array.isArray(override) ? (override as Record<string, unknown>) : {};
  return defaults.map((d) => {
    const raw = source[String(d.stage)];
    const base: StageLabel = { ...d, layout: d.layout ?? DEFAULT_LAYOUT };
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return base;
    const o = raw as Record<string, unknown>;
    const title = typeof o.title === 'string' ? o.title.trim().slice(0, STAGE_TITLE_MAX) : '';
    const note = typeof o.note === 'string' ? o.note.trim().slice(0, STAGE_NOTE_MAX) : null;
    return {
      stage: d.stage,
      title: title || base.title,
      note: note ?? base.note,
      enabled: typeof o.enabled === 'boolean' ? o.enabled : base.enabled,
      layout: o.layout === undefined ? base.layout : parseLayout(o.layout),
    };
  });
}

// ===== Ảnh đẹp (♥): khung đầu trang chi tiết đội, không tiêu đề =====

export const MAX_FEATURED = 12;

export interface FeaturedConfig {
  layout: StageLayout;
  enabled: boolean;
}

/** Cấu hình khung ảnh đẹp trong `products.stage_config.featured`; mặc định Trình chiếu, đang hiện. */
export function parseFeaturedConfig(stageConfig: unknown): FeaturedConfig {
  const src = stageConfig && typeof stageConfig === 'object' && !Array.isArray(stageConfig) ? (stageConfig as Record<string, unknown>).featured : null;
  const o = src && typeof src === 'object' && !Array.isArray(src) ? (src as Record<string, unknown>) : {};
  return { layout: parseLayout(o.layout), enabled: typeof o.enabled === 'boolean' ? o.enabled : true };
}

/**
 * Ảnh đẹp hiển thị cho khách: đã đánh dấu ♥, thuộc giai đoạn đang hiện; xếp theo thời điểm đánh dấu.
 */
export function pickFeatured<T extends { stage: number | null; featuredAt: Date | null }>(images: T[], visibleStages: readonly number[]): T[] {
  return images
    .filter((i) => i.featuredAt && i.stage !== null && visibleStages.includes(i.stage))
    .sort((a, b) => a.featuredAt!.getTime() - b.featuredAt!.getTime());
}

/** Gộp cấu hình mới vào `stage_config` cũ mà không làm mất các phần khác (giai đoạn / ảnh đẹp). */
export function mergeStageConfig(previous: unknown, patch: Record<string, unknown>): Record<string, unknown> {
  const base = previous && typeof previous === 'object' && !Array.isArray(previous) ? (previous as Record<string, unknown>) : {};
  return { ...base, ...patch };
}

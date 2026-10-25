import 'server-only';

/** Rate limit cửa sổ cố định, trong bộ nhớ (đủ cho triển khai 1 instance). */
type Bucket = { count: number; resetAt: number };

const g = globalThis as unknown as { __rateBuckets?: Map<string, Bucket> };
const buckets = (g.__rateBuckets ??= new Map());

let lastSweep = Date.now();
function sweep(now: number) {
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [key, bucket] of buckets) if (bucket.resetAt <= now) buckets.delete(key);
}

/** Tăng bộ đếm; trả về true nếu vẫn trong giới hạn. */
export function hit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  sweep(now);
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  bucket.count += 1;
  return bucket.count <= limit;
}

/** Kiểm tra mà không tăng bộ đếm. */
export function isOver(key: string, limit: number): boolean {
  const bucket = buckets.get(key);
  return !!bucket && bucket.resetAt > Date.now() && bucket.count >= limit;
}

export function reset(key: string): void {
  buckets.delete(key);
}

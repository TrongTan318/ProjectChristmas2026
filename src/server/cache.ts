import 'server-only';

/**
 * Cache trong bộ nhớ cho một instance. Gộp các request đồng thời cùng khóa
 * thành một truy vấn DB duy nhất (tránh "thundering herd" khi đông người vào).
 */
type Entry = { value: unknown; expires: number };

const g = globalThis as unknown as {
  __memCache?: Map<string, Entry>;
  __memInflight?: Map<string, Promise<unknown>>;
};
const store = (g.__memCache ??= new Map());
const inflight = (g.__memInflight ??= new Map());

export async function cached<T>(key: string, ttlMs: number, fn: () => Promise<T>): Promise<T> {
  const hit = store.get(key);
  if (hit && hit.expires > Date.now()) return hit.value as T;
  const pending = inflight.get(key);
  if (pending) return pending as Promise<T>;
  const promise = fn()
    .then((value) => {
      store.set(key, { value, expires: Date.now() + ttlMs });
      return value;
    })
    .finally(() => inflight.delete(key));
  inflight.set(key, promise);
  return promise;
}

export function invalidate(prefix = ''): void {
  for (const key of store.keys()) if (key.startsWith(prefix)) store.delete(key);
}

/** Xóa cache nội dung công khai + kết quả. Gọi sau mọi thay đổi từ Admin. */
export function invalidatePublic(): void {
  invalidate('c:');
  invalidate('r:');
}

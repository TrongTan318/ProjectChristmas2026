import 'server-only';
import { z } from 'zod';

const schema = z.object({
  DATABASE_URL: z.string().min(1),
  PUBLIC_BASE_URL: z.string().url().default('http://localhost:3000'),
  SESSION_SECRET: z.string().min(32, 'SESSION_SECRET phải ≥ 32 ký tự'),
  TOKEN_SECRET: z.string().min(32, 'TOKEN_SECRET phải ≥ 32 ký tự'),
  IP_SALT: z.string().min(16, 'IP_SALT phải ≥ 16 ký tự'),
  UPLOAD_DIR: z.string().default('./storage/media'),
  COOKIE_SECURE: z
    .enum(['true', 'false'])
    .default('false')
    .transform((v) => v === 'true'),
});

let cached: z.infer<typeof schema> | undefined;

/** Đọc env lúc chạy (không lúc build), báo lỗi rõ ràng nếu thiếu. */
export function env() {
  cached ??= schema.parse(process.env);
  return cached;
}

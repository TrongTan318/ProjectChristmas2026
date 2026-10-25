import 'server-only';
import { createHmac } from 'node:crypto';
import { headers } from 'next/headers';
import { env } from './env';

/** IP client. Nginx đặt X-Real-IP (đã xử lý Cloudflare qua real_ip module). */
export async function clientIp(): Promise<string> {
  const h = await headers();
  return (
    h.get('x-real-ip') ??
    h.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    'unknown'
  );
}

export function hashIp(ip: string): string {
  return createHmac('sha256', env().IP_SALT).update(ip).digest('hex').slice(0, 32);
}

export async function clientUserAgent(): Promise<string> {
  return ((await headers()).get('user-agent') ?? '').slice(0, 300);
}

/** Chống CSRF cho route handler (Server Action đã được Next kiểm tra Origin). */
export function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get('origin');
  if (!origin) return false;
  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host');
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

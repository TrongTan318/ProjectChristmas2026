import { createHmac, randomBytes } from 'node:crypto';

/** Crockford Base32: bỏ I, L, O, U để tránh đọc nhầm khi nhập tay. */
const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
export const TOKEN_LENGTH = 16; // 16 ký tự × 5 bit = 80 bit entropy
const TOKEN_PATTERN = /^[0-9A-HJKMNP-TV-Z]{16}$/;

export function generateToken(): string {
  const bytes = randomBytes(10);
  let out = '';
  let buffer = 0;
  let bits = 0;
  for (const byte of bytes) {
    buffer = (buffer << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      out += ALPHABET[(buffer >>> (bits - 5)) & 31];
      bits -= 5;
    }
    buffer &= (1 << bits) - 1;
  }
  return out;
}

/** Chuẩn hóa mã người dùng nhập: bỏ gạch/khoảng trắng, viết hoa, sửa ký tự dễ nhầm. */
export function normalizeToken(input: string): string | null {
  const cleaned = input
    .toUpperCase()
    .replace(/[\s\-_.]/g, '')
    .replace(/[IL]/g, '1')
    .replace(/O/g, '0');
  return TOKEN_PATTERN.test(cleaned) ? cleaned : null;
}

export function formatToken(token: string): string {
  return token.match(/.{1,4}/g)?.join('-') ?? token;
}

export function hashToken(token: string, secret: string): string {
  return createHmac('sha256', secret).update(token).digest('hex');
}

export function formatSerial(serial: number): string {
  return String(serial).padStart(4, '0');
}

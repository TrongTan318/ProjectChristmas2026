import { createHmac, randomInt } from 'node:crypto';

/** Crockford Base32: bỏ I, L, O, U để tránh đọc nhầm khi nhập tay. */
const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
export const TOKEN_LENGTH = 5; // 5 ký tự × 5 bit = 25 bit (~33,5 triệu mã)
const TOKEN_PATTERN = /^[0-9A-HJKMNP-TV-Z]{5}$/;

export function generateToken(): string {
  let out = '';
  for (let i = 0; i < TOKEN_LENGTH; i++) out += ALPHABET[randomInt(ALPHABET.length)];
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
  return token;
}

export function hashToken(token: string, secret: string): string {
  return createHmac('sha256', secret).update(token).digest('hex');
}

export function formatSerial(serial: number): string {
  return String(serial).padStart(4, '0');
}

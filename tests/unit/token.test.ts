import { describe, expect, it } from 'vitest';
import { formatSerial, formatToken, generateToken, hashToken, normalizeToken, TOKEN_LENGTH } from '@/domain/token';

describe('generateToken', () => {
  it('sinh 5 ký tự Crockford Base32', () => {
    for (let i = 0; i < 500; i++) {
      const t = generateToken();
      expect(t).toHaveLength(TOKEN_LENGTH);
      expect(t).toMatch(/^[0-9A-HJKMNP-TV-Z]{5}$/);
    }
  });

  it('phân bố ký tự đều (không lệch về một ký tự)', () => {
    const counts = new Map<string, number>();
    for (let i = 0; i < 4000; i++) for (const c of generateToken()) counts.set(c, (counts.get(c) ?? 0) + 1);
    expect(counts.size).toBe(32);
    const avg = (4000 * TOKEN_LENGTH) / 32;
    for (const n of counts.values()) expect(Math.abs(n - avg) / avg).toBeLessThan(0.15);
  });
});

describe('normalizeToken', () => {
  const token = generateToken();

  it('chấp nhận chữ thường, gạch ngang, khoảng trắng', () => {
    expect(normalizeToken(formatToken(token).toLowerCase())).toBe(token);
    expect(normalizeToken(` ${formatToken(token).replace(/-/g, ' ')} `)).toBe(token);
  });

  it('sửa ký tự dễ nhầm: O→0, I/L→1', () => {
    expect(normalizeToken('OIL-0O')).toBe('01100');
  });

  it('từ chối mã sai độ dài hoặc ký tự lạ', () => {
    expect(normalizeToken('ABC')).toBeNull();
    expect(normalizeToken('ABCD-EFGH-JKMN-PQRS')).toBeNull(); // mã 16 ký tự cũ
    expect(normalizeToken('ABCDU')).toBeNull(); // U không thuộc bảng mã
    expect(normalizeToken('<script>alert(1)</script>')).toBeNull();
    expect(normalizeToken("' OR 1=1 --")).toBeNull();
  });
});

describe('hashToken', () => {
  it('ổn định với cùng secret, khác với secret khác', () => {
    const t = generateToken();
    expect(hashToken(t, 'a'.repeat(32))).toBe(hashToken(t, 'a'.repeat(32)));
    expect(hashToken(t, 'a'.repeat(32))).not.toBe(hashToken(t, 'b'.repeat(32)));
    expect(hashToken(t, 'a'.repeat(32))).toMatch(/^[0-9a-f]{64}$/);
  });
});

describe('format', () => {
  it('định dạng mã và seri', () => {
    expect(formatToken('N34S5')).toBe('N34S5');
    expect(formatSerial(7)).toBe('0007');
    expect(formatSerial(1000)).toBe('1000');
  });
});

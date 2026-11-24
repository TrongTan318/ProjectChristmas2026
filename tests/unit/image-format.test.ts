import { describe, expect, it } from 'vitest';
import { detectHeif } from '@/lib/image-format';

/** Đầu tệp giả: [size 4 byte] "ftyp" [brand 4 byte] + phần đệm. */
const header = (box: string, brand: string) => new Uint8Array([0, 0, 0, 24, ...Buffer.from(box + brand, 'ascii'), 0, 0, 0, 0]);

describe('detectHeif', () => {
  it('ảnh HEIC của iPhone (brand heic/heix/hevc) → hevc', () => {
    expect(detectHeif(header('ftyp', 'heic'))).toBe('hevc');
    expect(detectHeif(header('ftyp', 'heix'))).toBe('hevc');
    expect(detectHeif(header('ftyp', 'hevc'))).toBe('hevc');
  });

  it('brand chung mif1/msf1 → generic (có thể là HEVC hoặc AVIF)', () => {
    expect(detectHeif(header('ftyp', 'mif1'))).toBe('generic');
  });

  it('AVIF, JPG, PNG, tệp quá ngắn → không phải HEIC', () => {
    expect(detectHeif(header('ftyp', 'avif'))).toBeNull();
    expect(detectHeif(new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0x10, 0x4a, 0x46, 0x49, 0x46, 0, 1]))).toBeNull();
    expect(detectHeif(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]))).toBeNull();
    expect(detectHeif(new Uint8Array([0, 0, 0]))).toBeNull();
  });
});

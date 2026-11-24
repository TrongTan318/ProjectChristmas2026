import { describe, expect, it } from 'vitest';
import { MAX_DETAIL_ROWS, parseDetails, pickSlots } from '@/domain/personal-item';

describe('parseDetails', () => {
  it('giữ các dòng hợp lệ, cắt khoảng trắng', () => {
    expect(parseDetails([{ label: ' Chất liệu ', value: ' Giấy tái chế ' }, { label: 'Năm', value: '2026' }])).toEqual([
      { label: 'Chất liệu', value: 'Giấy tái chế' },
      { label: 'Năm', value: '2026' },
    ]);
  });

  it('bỏ dòng không có nội dung, sai kiểu; dữ liệu không phải mảng → rỗng', () => {
    expect(parseDetails([{ label: 'Trống', value: '  ' }, null, 'x', [1], { label: 5, value: 'Ghi chú' }])).toEqual([
      { label: '', value: 'Ghi chú' },
    ]);
    expect(parseDetails(null)).toEqual([]);
    expect(parseDetails({ label: 'a', value: 'b' })).toEqual([]);
  });

  it('cắt độ dài và giới hạn số dòng', () => {
    const many = Array.from({ length: 20 }, (_, i) => ({ label: 'L'.repeat(100), value: `${i}`.padEnd(500, 'v') }));
    const out = parseDetails(many);
    expect(out).toHaveLength(MAX_DETAIL_ROWS);
    expect(out[0]!.label).toHaveLength(40);
    expect(out[0]!.value).toHaveLength(300);
  });
});

describe('pickSlots', () => {
  const img = (id: string, sortOrder: number, isMain = false) => ({ id, sortOrder, isMain });

  it('ảnh chính vào khung giữa, 2 ảnh phụ theo thứ tự vào nền khung trên / dưới', () => {
    const s = pickSlots([img('b', 1), img('a', 0), img('m', 2, true)]);
    expect(s.main?.id).toBe('m');
    expect(s.top?.id).toBe('a');
    expect(s.bottom?.id).toBe('b');
  });

  it('ảnh dư (dữ liệu cũ) bị bỏ qua', () => {
    const s = pickSlots([img('a', 0, true), img('b', 1), img('c', 2), img('d', 3)]);
    expect([s.main?.id, s.top?.id, s.bottom?.id]).toEqual(['a', 'b', 'c']);
  });

  it('chưa đánh dấu ảnh chính → ảnh đầu tiên; thiếu ảnh → ô trống (null)', () => {
    const s = pickSlots([img('b', 1), img('a', 0)]);
    expect(s.main?.id).toBe('a');
    expect(s.top?.id).toBe('b');
    expect(s.bottom).toBeNull();
  });

  it('không có ảnh', () => {
    expect(pickSlots([]).main).toBeNull();
  });
});

import { describe, expect, it } from 'vitest';
import { defaultOpenStage, groupByStage, parseStage, pickCover } from '@/domain/stage';

const img = (id: string, stage: number | null, sortOrder: number, isCover = false) => ({ id, stage, sortOrder, isCover });

describe('parseStage', () => {
  it('nhận 1, 2, 3 (số hoặc chuỗi)', () => {
    expect(parseStage(1)).toBe(1);
    expect(parseStage('2')).toBe(2);
    expect(parseStage('3')).toBe(3);
  });
  it('trả null khi trống hoặc ngoài phạm vi', () => {
    for (const v of [null, undefined, '', '0', '4', 'abc', 1.5, -1]) expect(parseStage(v)).toBeNull();
  });
});

describe('groupByStage', () => {
  it('gom theo giai đoạn, sắp theo sortOrder, bỏ ảnh chung', () => {
    const g = groupByStage([img('a', 2, 1), img('b', null, 0), img('c', 2, 0), img('d', 1, 0), img('e', 7, 0)]);
    expect(g[1].map((i) => i.id)).toEqual(['d']);
    expect(g[2].map((i) => i.id)).toEqual(['c', 'a']);
    expect(g[3]).toEqual([]);
  });
});

describe('pickCover', () => {
  it('ưu tiên ảnh được đánh dấu đại diện', () => {
    expect(pickCover([img('a', null, 0), img('b', null, 1, true), img('c', 3, 0)])?.id).toBe('b');
  });
  it('ảnh giai đoạn được đánh dấu đại diện thắng ảnh giai đoạn mới hơn', () => {
    expect(pickCover([img('a', 3, 0), img('b', 1, 2, true)])?.id).toBe('b');
  });
  it('không có đánh dấu → ảnh chung đầu tiên', () => {
    expect(pickCover([img('a', null, 1), img('b', null, 0), img('c', 3, 0)])?.id).toBe('b');
  });
  it('không có ảnh chung → ảnh đầu của giai đoạn mới nhất có ảnh', () => {
    expect(pickCover([img('a', 1, 0), img('b', 2, 1), img('c', 2, 0)])?.id).toBe('c');
  });
  it('không có ảnh → null', () => {
    expect(pickCover([])).toBeNull();
  });
});

describe('defaultOpenStage', () => {
  it('mở giai đoạn mới nhất có ảnh', () => {
    expect(defaultOpenStage([{ stage: 1, count: 4 }, { stage: 2, count: 2 }, { stage: 3, count: 0 }])).toBe(2);
  });
  it('chưa có ảnh nào → giai đoạn mới nhất đang hiện', () => {
    expect(defaultOpenStage([{ stage: 1, count: 0 }, { stage: 2, count: 0 }])).toBe(2);
  });
  it('không có giai đoạn nào hiện → null', () => {
    expect(defaultOpenStage([])).toBeNull();
  });
});

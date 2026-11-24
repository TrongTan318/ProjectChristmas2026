import { describe, expect, it } from 'vitest';
import { frameFor, tileRatio } from '@/domain/frame';
import { defaultOpenStage, groupByStage, mergeStageConfig, mergeStageLabels, parseFeaturedConfig, parseLayout, parseStage, pickCover, pickFeatured, STAGE_LAYOUTS } from '@/domain/stage';

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

describe('mergeStageLabels', () => {
  const defaults = [
    { stage: 1 as const, title: 'Giai đoạn 1', note: 'Chuẩn bị', enabled: true, layout: 'slideshow' as const },
    { stage: 2 as const, title: 'Giai đoạn 2', note: '', enabled: true, layout: 'slideshow' as const },
    { stage: 3 as const, title: 'Giai đoạn 3', note: '', enabled: false, layout: 'slideshow' as const },
  ];

  it('không có cấu hình riêng → giữ mặc định', () => {
    expect(mergeStageLabels(defaults, null)).toEqual(defaults);
    expect(mergeStageLabels(defaults, 'rác')).toEqual(defaults);
    expect(mergeStageLabels(defaults, [1, 2])).toEqual(defaults);
  });

  it('ghi đè tên, mô tả, bật/tắt theo từng giai đoạn', () => {
    const out = mergeStageLabels(defaults, { '1': { title: 'Dựng khung', enabled: false }, '3': { enabled: true, note: 'Hoàn thiện' } });
    expect(out[0]).toEqual({ stage: 1, title: 'Dựng khung', note: 'Chuẩn bị', enabled: false, layout: 'slideshow' });
    expect(out[1]).toEqual(defaults[1]);
    expect(out[2]).toEqual({ stage: 3, title: 'Giai đoạn 3', note: 'Hoàn thiện', enabled: true, layout: 'slideshow' });
  });

  it('tên rỗng dùng tên mặc định; kiểu sai bị bỏ qua; cắt độ dài', () => {
    const out = mergeStageLabels(defaults, { '2': { title: '   ', enabled: 'yes', note: 5 }, '1': { title: 'x'.repeat(200) } });
    expect(out[1]).toEqual(defaults[1]);
    expect(out[0]!.title).toHaveLength(80);
  });
});

describe('frameFor', () => {
  it('ảnh dọc lớn → khung dọc theo đúng tỉ lệ', () => {
    expect(frameFor({ width: 1200, height: 1600 })).toEqual({ mode: 'fit', ratio: 0.75 });
  });
  it('ảnh ngang lớn → khung ngang', () => {
    expect(frameFor({ width: 1600, height: 900 })).toEqual({ mode: 'fit', ratio: 1600 / 900 });
  });
  it('ảnh nhỏ → khung mặc định 4:3', () => {
    expect(frameFor({ width: 640, height: 960 })).toEqual({ mode: 'default', ratio: 4 / 3 });
  });
  it('ảnh quá dài/quá dẹt bị giới hạn tỉ lệ; kích thước lỗi → mặc định', () => {
    expect(frameFor({ width: 800, height: 4000 }).ratio).toBe(9 / 16);
    expect(frameFor({ width: 6000, height: 800 }).ratio).toBe(21 / 9);
    expect(frameFor({ width: 0, height: 0 }).mode).toBe('default');
  });
});

describe('kiểu khung giai đoạn', () => {
  const defaults = [1, 2, 3].map((n) => ({ stage: n as 1 | 2 | 3, title: 'Giai đoạn ' + n, note: '', enabled: true }));

  it('có 6 kiểu, mặc định Trình chiếu', () => {
    expect(STAGE_LAYOUTS).toHaveLength(6);
    expect(parseLayout(undefined)).toBe('slideshow');
    expect(parseLayout('hack')).toBe('slideshow');
    expect(parseLayout('diamond')).toBe('diamond');
  });

  it('lớp chưa chọn khung → Trình chiếu; chọn rồi thì dùng khung đã chọn; giá trị lạ → Trình chiếu', () => {
    const out = mergeStageLabels(defaults, { '1': { layout: 'polaroid' }, '2': { layout: '<script>' }, '3': { title: 'Xong' } });
    expect(out.map((l) => l.layout)).toEqual(['polaroid', 'slideshow', 'slideshow']);
  });
});

describe('tileRatio', () => {
  it('đúng tỉ lệ ảnh, có giới hạn, lỗi → 4:3', () => {
    expect(tileRatio({ width: 1200, height: 1600 })).toBe(0.75);
    expect(tileRatio({ width: 300, height: 3000 })).toBe(9 / 16);
    expect(tileRatio({ width: 0, height: 10 })).toBe(4 / 3);
  });
});

describe('ảnh đẹp (♥)', () => {
  it('cấu hình mặc định: Trình chiếu, đang hiện; đọc được giá trị đã lưu; giá trị lạ → mặc định', () => {
    expect(parseFeaturedConfig(null)).toEqual({ layout: 'slideshow', enabled: true });
    expect(parseFeaturedConfig({ featured: { layout: 'masonry', enabled: false } })).toEqual({ layout: 'masonry', enabled: false });
    expect(parseFeaturedConfig({ featured: { layout: 'x', enabled: 'no' } })).toEqual({ layout: 'slideshow', enabled: true });
  });

  it('chỉ lấy ảnh đã ♥ thuộc giai đoạn đang hiện, xếp theo thời điểm đánh dấu', () => {
    const d = (n: number) => new Date(2026, 10, 24, 10, n);
    const imgs = [
      { id: 'a', stage: 1, featuredAt: d(3) },
      { id: 'b', stage: 2, featuredAt: d(1) },
      { id: 'c', stage: 3, featuredAt: d(2) }, // giai đoạn 3 đang ẩn
      { id: 'd', stage: 1, featuredAt: null },
      { id: 'e', stage: null, featuredAt: d(0) },
    ];
    expect(pickFeatured(imgs, [1, 2]).map((i) => i.id)).toEqual(['b', 'a']);
  });

  it('gộp cấu hình không làm mất phần khác', () => {
    const prev = { '1': { title: 'A' }, featured: { layout: 'diamond', enabled: true } };
    expect(mergeStageConfig(prev, { '1': { title: 'B' } })).toEqual({ '1': { title: 'B' }, featured: { layout: 'diamond', enabled: true } });
    expect(mergeStageConfig(null, { featured: { layout: 'museum', enabled: false } })).toEqual({ featured: { layout: 'museum', enabled: false } });
  });
});

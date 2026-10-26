import { describe, expect, it } from 'vitest';
import { getVotingState, pickFeatured, rank, stateToError } from '@/domain/voting';
import { parseYoutubeId } from '@/lib/media';
import { fromLocalInput, slugify, toLocalInput } from '@/lib/format';

const start = new Date('2026-12-20T11:00:00Z');
const end = new Date('2026-12-27T14:00:00Z');

describe('getVotingState', () => {
  it('LOCKED luôn thắng khung giờ', () => {
    expect(getVotingState({ votingStatus: 'LOCKED', votingStartAt: start, votingEndAt: end }, new Date('2026-12-22T00:00:00Z'))).toBe('LOCKED');
  });
  it('trước giờ mở → NOT_STARTED', () => {
    expect(getVotingState({ votingStatus: 'OPEN', votingStartAt: start, votingEndAt: end }, new Date('2026-12-19T00:00:00Z'))).toBe('NOT_STARTED');
  });
  it('trong khung giờ → OPEN', () => {
    expect(getVotingState({ votingStatus: 'OPEN', votingStartAt: start, votingEndAt: end }, new Date('2026-12-22T00:00:00Z'))).toBe('OPEN');
  });
  it('sau giờ đóng (token hết hạn) → ENDED', () => {
    expect(getVotingState({ votingStatus: 'OPEN', votingStartAt: start, votingEndAt: end }, new Date('2026-12-28T00:00:00Z'))).toBe('ENDED');
  });
  it('không đặt khung giờ → chỉ phụ thuộc trạng thái', () => {
    expect(getVotingState({ votingStatus: 'OPEN', votingStartAt: null, votingEndAt: null })).toBe('OPEN');
  });
  it('map trạng thái sang mã lỗi', () => {
    expect(stateToError('OPEN')).toBeNull();
    expect(stateToError('ENDED')).toBe('VOTING_ENDED');
  });
});

describe('rank', () => {
  it('đồng phiếu đồng hạng, hạng kế tiếp nhảy cóc', () => {
    const r = rank([{ id: 'a', votes: 5 }, { id: 'b', votes: 9 }, { id: 'c', votes: 5 }, { id: 'd', votes: 1 }]);
    expect(r.map((x) => [x.id, x.rank])).toEqual([['b', 1], ['a', 2], ['c', 2], ['d', 4]]);
    expect(r.reduce((s, x) => s + x.percent, 0)).toBeCloseTo(100);
  });
  it('không có phiếu → 0%', () => {
    expect(rank([{ votes: 0 }])[0]!.percent).toBe(0);
  });
});

describe('pickFeatured', () => {
  it('lấy 3 sản phẩm nhiều phiếu nhất, bằng phiếu thì xét lượt xem', () => {
    const r = pickFeatured([
      { id: 'a', votes: 5, views: 10 },
      { id: 'b', votes: 9, views: 1 },
      { id: 'c', votes: 5, views: 40 },
      { id: 'd', votes: 2, views: 999 },
      { id: 'e', votes: 1, views: 0 },
    ]);
    expect(r.map((x) => x.id)).toEqual(['b', 'c', 'a']);
  });
  it('bỏ qua sản phẩm 0 phiếu; chưa có phiếu nào → rỗng', () => {
    expect(pickFeatured([{ id: 'a', votes: 1, views: 0 }, { id: 'b', votes: 0, views: 50 }]).map((x) => x.id)).toEqual(['a']);
    expect(pickFeatured([{ votes: 0, views: 100 }])).toEqual([]);
  });
});

describe('tiện ích', () => {
  it('parseYoutubeId nhận nhiều dạng link', () => {
    expect(parseYoutubeId('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=1')).toBe('dQw4w9WgXcQ');
    expect(parseYoutubeId('https://youtu.be/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    expect(parseYoutubeId('https://www.youtube.com/shorts/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    expect(parseYoutubeId('https://evil.com/watch?v=dQw4w9WgXcQ')).toBeNull();
    expect(parseYoutubeId('javascript:alert(1)')).toBeNull();
  });
  it('slugify bỏ dấu tiếng Việt', () => {
    expect(slugify('Hang Đá Bêlem — Đêm Thánh!')).toBe('hang-da-belem-dem-thanh');
  });
  it('chuyển đổi giờ Việt Nam', () => {
    const d = fromLocalInput('2026-12-24T19:30');
    expect(d?.toISOString()).toBe('2026-12-24T12:30:00.000Z');
    expect(toLocalInput(d)).toBe('2026-12-24T19:30');
  });
});

import { describe, expect, it } from 'vitest';
import { normalizeNewlines, splitParagraphs } from '@/lib/format';

describe('normalizeNewlines', () => {
  it('CRLF / CR → LF', () => {
    expect(normalizeNewlines('a\r\nb\rc\nd')).toBe('a\nb\nc\nd');
  });
});

describe('splitParagraphs', () => {
  it('tách theo dòng trống, giữ xuống dòng đơn trong đoạn', () => {
    expect(splitParagraphs('Đoạn 1\n\nĐoạn 2 dòng a\nĐoạn 2 dòng b')).toEqual(['Đoạn 1', 'Đoạn 2 dòng a\nĐoạn 2 dòng b']);
  });
  it('nhận dữ liệu CRLF do trình duyệt gửi (lỗi cũ: cả nội dung thành 1 đoạn)', () => {
    expect(splitParagraphs('A\r\n\r\nB\r\nB2\r\n\r\nC')).toEqual(['A', 'B\nB2', 'C']);
  });
  it('dòng trống có khoảng trắng, nhiều dòng trống liền nhau, đầu/cuối thừa', () => {
    expect(splitParagraphs('\n\nA\n  \nB\n\n\n\nC\n\n')).toEqual(['A', 'B', 'C']);
  });
  it('rỗng → không có đoạn nào', () => {
    expect(splitParagraphs('')).toEqual([]);
    expect(splitParagraphs(' \r\n \n')).toEqual([]);
  });
});

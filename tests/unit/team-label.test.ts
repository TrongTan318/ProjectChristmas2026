import { describe, expect, it } from 'vitest';
import { teamLabel } from '@/lib/format';

describe('teamLabel', () => {
  it('có tên đội → "Lớp · Tên đội"', () => {
    expect(teamLabel({ className: 'Rước lễ 2', name: 'Đội 5' })).toBe('Rước lễ 2 · Đội 5');
  });
  it('không có tên đội (null / rỗng / chỉ khoảng trắng) → chỉ tên lớp', () => {
    expect(teamLabel({ className: 'Rước lễ 2', name: null })).toBe('Rước lễ 2');
    expect(teamLabel({ className: 'Rước lễ 2', name: '' })).toBe('Rước lễ 2');
    expect(teamLabel({ className: 'Rước lễ 2', name: '   ' })).toBe('Rước lễ 2');
  });
});

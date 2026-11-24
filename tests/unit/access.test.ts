import { describe, expect, it } from 'vitest';
import { canManageProduct, isStaffRole, isValidUsername, parseLoginId, suggestUsername } from '@/domain/access';

describe('isStaffRole', () => {
  it('Super Admin và Admin là quản trị viên', () => {
    expect(isStaffRole('SUPER_ADMIN')).toBe(true);
    expect(isStaffRole('ADMIN')).toBe(true);
  });
  it('tài khoản lớp và vai trò lạ không phải quản trị viên', () => {
    expect(isStaffRole('TEAM')).toBe(false);
    expect(isStaffRole('')).toBe(false);
    expect(isStaffRole('admin')).toBe(false);
  });
});

describe('canManageProduct', () => {
  it('quản trị viên sửa được mọi sản phẩm, kể cả sản phẩm chưa gắn đội', () => {
    expect(canManageProduct({ roleCode: 'ADMIN', teamId: null }, { teamId: 't1' })).toBe(true);
    expect(canManageProduct({ roleCode: 'SUPER_ADMIN', teamId: null }, { teamId: null })).toBe(true);
  });
  it('tài khoản lớp chỉ sửa được sản phẩm của lớp mình', () => {
    expect(canManageProduct({ roleCode: 'TEAM', teamId: 't1' }, { teamId: 't1' })).toBe(true);
    expect(canManageProduct({ roleCode: 'TEAM', teamId: 't1' }, { teamId: 't2' })).toBe(false);
  });
  it('tài khoản lớp chưa gắn lớp hoặc sản phẩm không có đội → từ chối', () => {
    expect(canManageProduct({ roleCode: 'TEAM', teamId: null }, { teamId: null })).toBe(false);
    expect(canManageProduct({ roleCode: 'TEAM', teamId: null }, { teamId: 't1' })).toBe(false);
    expect(canManageProduct({ roleCode: 'TEAM', teamId: 't1' }, { teamId: null })).toBe(false);
  });
  it('vai trò lạ bị từ chối', () => {
    expect(canManageProduct({ roleCode: 'GUEST', teamId: 't1' }, { teamId: 't1' })).toBe(false);
  });
});

describe('tên đăng nhập', () => {
  it('hợp lệ: chữ thường, số, gạch ngang ở giữa, 3–40 ký tự', () => {
    expect(isValidUsername('belem-anh-sao')).toBe(true);
    expect(isValidUsername('lop1')).toBe(true);
  });
  it('không hợp lệ', () => {
    expect(isValidUsername('ab')).toBe(false);
    expect(isValidUsername('-abc')).toBe(false);
    expect(isValidUsername('abc-')).toBe(false);
    expect(isValidUsername('Lớp 1')).toBe(false);
    expect(isValidUsername('a'.repeat(41))).toBe(false);
  });
});

describe('parseLoginId', () => {
  it('nhận email', () => {
    expect(parseLoginId(' Admin@Example.com ')).toEqual({ kind: 'email', value: 'admin@example.com' });
  });
  it('nhận tên đăng nhập (không phân biệt hoa thường)', () => {
    expect(parseLoginId('Belem-Anh-Sao')).toEqual({ kind: 'username', value: 'belem-anh-sao' });
  });
  it('từ chối dữ liệu rỗng hoặc sai', () => {
    expect(parseLoginId('')).toBeNull();
    expect(parseLoginId('a@b')).toBeNull();
    expect(parseLoginId('có dấu')).toBeNull();
  });
});

describe('suggestUsername', () => {
  it('bỏ dấu, chữ thường, gạch ngang', () => {
    expect(suggestUsername('Bao Đồng 1', new Set())).toBe('bao-dong-1');
  });
  it('tránh trùng bằng hậu tố số', () => {
    expect(suggestUsername('Bao Đồng 1', new Set(['bao-dong-1', 'bao-dong-1-2']))).toBe('bao-dong-1-3');
  });
  it('luôn là tên đăng nhập hợp lệ', () => {
    for (const name of ['A', '!!!', 'Thêm Sức 2 — Lớp chiều thứ Bảy rất rất dài tên', 'Ấu 1']) {
      expect(isValidUsername(suggestUsername(name, new Set()))).toBe(true);
    }
  });
});

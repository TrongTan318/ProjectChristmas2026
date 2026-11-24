/**
 * Phân quyền theo vai trò — logic thuần, không phụ thuộc Next/Prisma.
 * Mặc định từ chối: vai trò lạ không được coi là quản trị viên.
 */

export type RoleCodeLike = 'SUPER_ADMIN' | 'ADMIN' | 'TEAM';

/** Quản trị viên (Super Admin, Admin): vào được toàn bộ trang quản trị (trừ mục chỉ dành cho Super Admin). */
export function isStaffRole(code: string): boolean {
  return code === 'SUPER_ADMIN' || code === 'ADMIN';
}

/**
 * Được sửa ảnh/giai đoạn của sản phẩm không?
 * - Quản trị viên: mọi sản phẩm.
 * - Tài khoản lớp: chỉ sản phẩm của đúng lớp mình (cả hai phía phải có teamId).
 */
export function canManageProduct(
  user: { roleCode: string; teamId: string | null },
  product: { teamId: string | null },
): boolean {
  if (isStaffRole(user.roleCode)) return true;
  if (user.roleCode !== 'TEAM') return false;
  return !!user.teamId && !!product.teamId && user.teamId === product.teamId;
}

/** Tên đăng nhập: chữ thường không dấu, số, gạch ngang; 3–40 ký tự. */
export const USERNAME_RE = /^[a-z0-9](?:[a-z0-9-]{1,38})[a-z0-9]$/;

export function normalizeUsername(input: string): string {
  return input.trim().toLowerCase();
}

export function isValidUsername(input: string): boolean {
  return USERNAME_RE.test(input);
}

/** Ô đăng nhập nhận email hoặc tên đăng nhập. */
export function parseLoginId(input: string): { kind: 'email'; value: string } | { kind: 'username'; value: string } | null {
  const value = input.trim().toLowerCase();
  if (!value || value.length > 120) return null;
  if (value.includes('@')) return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? { kind: 'email', value } : null;
  return isValidUsername(value) ? { kind: 'username', value } : null;
}

/** Gợi ý tên đăng nhập từ tên lớp, tránh trùng: "Bao Đồng 1" → "bao-dong-1", "bao-dong-1-2"… */
export function suggestUsername(base: string, taken: ReadonlySet<string>): string {
  const root =
    base
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[đĐ]/g, 'd')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 34)
      .replace(/-+$/g, '') || 'lop';
  const padded = root.length < 3 ? `lop-${root}` : root;
  for (let i = 1; ; i++) {
    const candidate = i === 1 ? padded : `${padded}-${i}`;
    if (!taken.has(candidate)) return candidate;
  }
}

/** Bảng chữ dễ đọc khi phát mật khẩu trên giấy (bỏ 0/O, 1/l/I). */
export const PASSWORD_ALPHABET = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789';

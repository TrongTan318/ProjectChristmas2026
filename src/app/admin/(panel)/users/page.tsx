import { ActionForm, SubmitButton } from '@/components/admin/ActionForm';
import { Badge, Card, Checkbox, Field, Input, PageHeader, Select } from '@/components/admin/ui';
import { formatDateTime } from '@/lib/format';
import { requireSuperAdmin } from '@/server/auth';
import { prisma } from '@/server/db';
import { createUser, unlockUser, updateUser } from './actions';

export default async function UsersPage() {
  const me = await requireSuperAdmin();
  const users = await prisma.user.findMany({ where: { deletedAt: null }, include: { role: true }, orderBy: { createdAt: 'asc' } });

  return (
    <div className="space-y-6">
      <PageHeader title="Tài khoản quản trị" description="Super Admin: toàn quyền. Admin: quản lý nội dung, sản phẩm, xem thống kê." />

      <Card title="Tạo tài khoản">
        <ActionForm action={createUser} resetOnSuccess className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="Họ tên *"><Input name="name" required maxLength={120} /></Field>
            <Field label="Email *"><Input name="email" type="email" required maxLength={120} autoComplete="off" /></Field>
            <Field label="Mật khẩu *" hint="Tối thiểu 10 ký tự"><Input name="password" type="password" required minLength={10} autoComplete="new-password" /></Field>
            <Field label="Vai trò">
              <Select name="role" defaultValue="ADMIN">
                <option value="ADMIN">Admin</option>
                <option value="SUPER_ADMIN">Super Admin</option>
              </Select>
            </Field>
          </div>
          <Field label="Mật khẩu của bạn (xác nhận) *"><Input name="confirmPassword" type="password" required className="max-w-xs" autoComplete="current-password" /></Field>
          <SubmitButton>+ Tạo tài khoản</SubmitButton>
        </ActionForm>
      </Card>

      {users.map((u) => (
        <details key={u.id} className="rounded-xl border border-zinc-200 bg-white shadow-sm">
          <summary className="flex cursor-pointer list-none flex-wrap items-center gap-3 px-5 py-3">
            <span className="font-medium">{u.name}</span>
            <span className="text-sm text-zinc-500">{u.email}</span>
            <Badge tone={u.role.code === 'SUPER_ADMIN' ? 'blue' : 'zinc'}>{u.role.name}</Badge>
            {!u.isActive && <Badge tone="red">Đã khóa</Badge>}
            {u.lockedUntil && u.lockedUntil > new Date() && <Badge tone="amber">Tạm khóa đăng nhập</Badge>}
            {u.id === me.id && <Badge tone="green">Bạn</Badge>}
            <span className="ml-auto text-xs text-zinc-500">Đăng nhập gần nhất: {formatDateTime(u.lastLoginAt)}</span>
          </summary>
          <div className="border-t border-zinc-100 p-5">
            <ActionForm action={updateUser} className="space-y-4">
              <input type="hidden" name="id" value={u.id} />
              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="Họ tên"><Input name="name" required defaultValue={u.name} maxLength={120} /></Field>
                <Field label="Vai trò">
                  <Select name="role" defaultValue={u.role.code}>
                    <option value="ADMIN">Admin</option>
                    <option value="SUPER_ADMIN">Super Admin</option>
                  </Select>
                </Field>
                <Field label="Đặt lại mật khẩu" hint="Để trống nếu không đổi"><Input name="newPassword" type="password" minLength={10} autoComplete="new-password" /></Field>
              </div>
              <Checkbox name="isActive" label="Đang hoạt động" defaultChecked={u.isActive} />
              <Field label="Mật khẩu của bạn (xác nhận) *"><Input name="confirmPassword" type="password" required className="max-w-xs" autoComplete="current-password" /></Field>
              <SubmitButton>Lưu</SubmitButton>
            </ActionForm>
            {u.lockedUntil && u.lockedUntil > new Date() && (
              <ActionForm action={unlockUser} className="mt-3">
                <input type="hidden" name="id" value={u.id} />
                <SubmitButton variant="secondary">Mở khóa đăng nhập</SubmitButton>
              </ActionForm>
            )}
          </div>
        </details>
      ))}
    </div>
  );
}

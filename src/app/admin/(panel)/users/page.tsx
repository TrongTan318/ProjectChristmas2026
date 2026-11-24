import { ActionForm, SubmitButton } from '@/components/admin/ActionForm';
import { Badge, Card, Checkbox, Field, Input, PageHeader, Select } from '@/components/admin/ui';
import { formatDateTime } from '@/lib/format';
import { requireSuperAdmin } from '@/server/auth';
import { requireActiveContest } from '@/server/contest';
import { prisma } from '@/server/db';
import { createTeamAccounts, createUser, unlockUser, updateUser } from './actions';

const ROLE_TONE = { SUPER_ADMIN: 'blue', ADMIN: 'zinc', TEAM: 'amber' } as const;

export default async function UsersPage() {
  const me = await requireSuperAdmin();
  const contest = await requireActiveContest();
  const [users, teams] = await Promise.all([
    prisma.user.findMany({
      where: { deletedAt: null },
      include: { role: true, team: { select: { name: true, className: true } } },
      orderBy: [{ role: { code: 'asc' } }, { createdAt: 'asc' }],
    }),
    prisma.team.findMany({
      where: { contestId: contest.id, deletedAt: null },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      select: { id: true, name: true, className: true, _count: { select: { users: { where: { deletedAt: null, role: { code: 'TEAM' } } } } } },
    }),
  ]);
  const teamsWithout = teams.filter((t) => t._count.users === 0);

  const teamOptions = (
    <>
      <option value="">— Chọn lớp —</option>
      {teams.map((t) => (
        <option key={t.id} value={t.id}>{t.className} · {t.name}</option>
      ))}
    </>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tài khoản"
        description="Super Admin: toàn quyền. Admin: quản lý nội dung, sản phẩm, xem thống kê. Lớp: chỉ tải ảnh, đổi tên / ẩn giai đoạn của lớp mình."
      />

      <Card title="Tài khoản lớp">
        <div className="space-y-6">
          <ActionForm action={createTeamAccounts} className="space-y-3">
            <p className="text-sm text-zinc-700">
              {teamsWithout.length > 0 ? (
                <>
                  Còn <strong>{teamsWithout.length}</strong>/{teams.length} lớp chưa có tài khoản. Tạo nhanh: mỗi lớp 1 tài khoản, tên đăng nhập theo tên lớp,
                  mật khẩu ngẫu nhiên <strong>chỉ hiện 1 lần</strong> — chép lại ngay để phát cho từng lớp.
                </>
              ) : (
                <>Mọi lớp ({teams.length}) đều đã có tài khoản. Đặt lại mật khẩu ở danh sách bên dưới khi cần.</>
              )}
            </p>
            {teamsWithout.length > 0 && (
              <>
                <Field label="Mật khẩu của bạn (xác nhận) *"><Input name="confirmPassword" type="password" required className="max-w-xs" autoComplete="current-password" /></Field>
                <SubmitButton>+ Tạo tài khoản cho {teamsWithout.length} lớp</SubmitButton>
              </>
            )}
          </ActionForm>

          <details className="rounded-lg border border-zinc-200">
            <summary className="cursor-pointer px-4 py-3 text-sm font-medium">Tạo 1 tài khoản lớp (tự đặt tên đăng nhập, mật khẩu)</summary>
            <ActionForm action={createUser} resetOnSuccess className="space-y-4 border-t border-zinc-100 p-4">
              <input type="hidden" name="role" value="TEAM" />
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Field label="Lớp *"><Select name="teamId" required defaultValue="">{teamOptions}</Select></Field>
                <Field label="Tên hiển thị *"><Input name="name" required maxLength={120} placeholder="vd. Lớp Bao Đồng 1" /></Field>
                <Field label="Tên đăng nhập *" hint="Chữ thường không dấu, số, gạch ngang"><Input name="username" required minLength={3} maxLength={40} pattern="[a-z0-9][a-z0-9\-]{1,38}[a-z0-9]" autoComplete="off" /></Field>
                <Field label="Mật khẩu *" hint="Tối thiểu 10 ký tự"><Input name="password" type="password" required minLength={10} autoComplete="new-password" /></Field>
              </div>
              <Field label="Mật khẩu của bạn (xác nhận) *"><Input name="confirmPassword" type="password" required className="max-w-xs" autoComplete="current-password" /></Field>
              <SubmitButton>+ Tạo tài khoản lớp</SubmitButton>
            </ActionForm>
          </details>
        </div>
      </Card>

      <Card title="Tạo tài khoản quản trị">
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
            <span className="text-sm text-zinc-500">{u.username ?? u.email}</span>
            <Badge tone={ROLE_TONE[u.role.code]}>{u.role.name}</Badge>
            {u.role.code === 'TEAM' && (
              u.team ? <span className="text-sm text-zinc-600">{u.team.className} · {u.team.name}</span> : <Badge tone="red">Chưa gắn lớp</Badge>
            )}
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
                    <option value="TEAM">Lớp</option>
                  </Select>
                </Field>
                <Field label="Đặt lại mật khẩu" hint="Để trống nếu không đổi"><Input name="newPassword" type="password" minLength={10} autoComplete="new-password" /></Field>
              </div>
              {u.role.code === 'TEAM' && (
                <div className="grid gap-4 sm:grid-cols-3">
                  <Field label="Lớp"><Select name="teamId" defaultValue={u.teamId ?? ''}>{teamOptions}</Select></Field>
                  <Field label="Tên đăng nhập"><Input name="username" defaultValue={u.username ?? ''} maxLength={40} autoComplete="off" /></Field>
                </div>
              )}
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

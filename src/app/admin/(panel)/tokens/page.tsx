import type { Prisma, TokenStatus } from '@prisma/client';
import { ActionForm, SubmitButton } from '@/components/admin/ActionForm';
import { Badge, Card, Field, Input, PageHeader, Pagination, Select, Stat, Table } from '@/components/admin/ui';
import { formatSerial } from '@/domain/token';
import { formatDateTime, formatNumber } from '@/lib/format';
import { isSuperAdmin, requireAdmin } from '@/server/auth';
import { requireActiveContest } from '@/server/contest';
import { prisma } from '@/server/db';
import { revokeTokens, updateBatchZone } from './actions';
import { TokenBatchForm } from './TokenBatchForm';

const PAGE_SIZE = 50;
const STATUS: Record<TokenStatus, { label: string; tone: 'green' | 'zinc' | 'red' }> = {
  ACTIVE: { label: 'Chưa dùng', tone: 'green' },
  USED: { label: 'Đã dùng', tone: 'zinc' },
  REVOKED: { label: 'Vô hiệu', tone: 'red' },
};

type Search = { status?: string; serial?: string; page?: string };

export default async function TokensPage({ searchParams }: { searchParams: Promise<Search> }) {
  const user = await requireAdmin();
  const superAdmin = isSuperAdmin(user);
  const contest = await requireActiveContest();
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const status = sp.status && sp.status in STATUS ? (sp.status as TokenStatus) : undefined;
  const serial = Number(sp.serial) || undefined;

  const where: Prisma.VoteTokenWhereInput = { contestId: contest.id, deletedAt: null, status, serial };
  const [groups, zones, batches, tokens, total] = await Promise.all([
    prisma.voteToken.groupBy({ by: ['status'], where: { contestId: contest.id, deletedAt: null }, _count: { _all: true } }),
    prisma.zone.findMany({ where: { deletedAt: null }, orderBy: { sortOrder: 'asc' } }),
    prisma.tokenBatch.findMany({
      where: { contestId: contest.id, deletedAt: null },
      orderBy: { serialFrom: 'asc' },
      include: { zone: true, createdBy: { select: { name: true } } },
    }),
    prisma.voteToken.findMany({
      where,
      orderBy: { serial: 'asc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { batch: { select: { label: true } }, zone: { select: { name: true } }, vote: { select: { product: { select: { name: true } }, status: true } } },
    }),
    prisma.voteToken.count({ where }),
  ]);
  const usedByBatch = await prisma.voteToken.groupBy({
    by: ['batchId'],
    where: { contestId: contest.id, status: 'USED' },
    _count: { _all: true },
  });
  const count = (s: TokenStatus) => groups.find((g) => g.status === s)?._count._all ?? 0;
  const issued = groups.reduce((s, g) => s + g._count._all, 0);
  const makeHref = (p: number) => `/admin/tokens?${new URLSearchParams({ ...(status ? { status } : {}), ...(serial ? { serial: String(serial) } : {}), page: String(p) })}`;

  return (
    <div className="space-y-6">
      <PageHeader title="Phiếu QR" description="Mỗi phiếu giấy có một mã QR/token riêng, chỉ dùng được một lần." />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Stat label="Tổng phiếu" value={formatNumber(issued)} />
        <Stat label="Đã dùng" value={formatNumber(count('USED'))} tone="green" />
        <Stat label="Chưa dùng" value={formatNumber(count('ACTIVE'))} tone="gold" />
        <Stat label="Vô hiệu" value={formatNumber(count('REVOKED'))} />
      </div>

      {superAdmin ? (
        <Card title="Sinh lô phiếu mới">
          <p className="mb-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
            ⚠ Vì lý do bảo mật, hệ thống <strong>không lưu mã gốc</strong> của phiếu. File PDF chỉ được tải <strong>một lần</strong> ngay khi tạo.
            Nếu làm mất file, hãy vô hiệu lô đó và tạo lô mới.
          </p>
          <TokenBatchForm zones={zones.map((z) => ({ id: z.id, name: z.name }))} />
        </Card>
      ) : (
        <p className="rounded-lg bg-zinc-100 p-3 text-sm text-zinc-700">Chỉ Super Admin được sinh hoặc vô hiệu phiếu.</p>
      )}

      <Card title="Các lô phiếu">
        <Table>
          <thead>
            <tr><th>Lô</th><th>Dải seri</th><th>Số lượng</th><th>Đã dùng</th><th>Giáo khu</th><th>Tạo bởi</th></tr>
          </thead>
          <tbody>
            {batches.map((b) => (
              <tr key={b.id}>
                <td className="font-medium">{b.label}</td>
                <td className="tabular-nums">{formatSerial(b.serialFrom)} → {formatSerial(b.serialTo)}</td>
                <td className="tabular-nums">{b.quantity}</td>
                <td className="tabular-nums">{usedByBatch.find((u) => u.batchId === b.id)?._count._all ?? 0}</td>
                <td>
                  <ActionForm action={updateBatchZone} className="flex items-center gap-2">
                    <input type="hidden" name="batchId" value={b.id} />
                    <select name="zoneId" defaultValue={b.zoneId ?? ''} className="rounded border border-zinc-300 px-2 py-1 text-sm">
                      <option value="">— Chưa gán —</option>
                      {zones.map((z) => <option key={z.id} value={z.id}>{z.name}</option>)}
                    </select>
                    <SubmitButton variant="ghost">Lưu</SubmitButton>
                  </ActionForm>
                </td>
                <td className="text-zinc-600">{b.createdBy.name}<br /><span className="text-xs">{formatDateTime(b.createdAt)}</span></td>
              </tr>
            ))}
            {batches.length === 0 && <tr><td colSpan={6} className="py-6 text-center text-zinc-500">Chưa có lô phiếu nào.</td></tr>}
          </tbody>
        </Table>
      </Card>

      {superAdmin && (
        <Card title="Vô hiệu phiếu (mất / hỏng / nghi gian lận)">
          <ActionForm action={revokeTokens} resetOnSuccess confirmMessage="Vô hiệu các phiếu chưa dùng trong dải seri này? Không thể hoàn tác.">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <Field label="Từ seri *"><Input name="from" type="number" min={1} required /></Field>
              <Field label="Đến seri" hint="Để trống nếu chỉ 1 phiếu"><Input name="to" type="number" min={1} /></Field>
              <Field label="Lý do *" className="lg:col-span-2"><Input name="reason" required maxLength={300} placeholder="Phiếu bị thất lạc" /></Field>
              <Field label="Mật khẩu xác nhận *"><Input name="password" type="password" required autoComplete="current-password" /></Field>
            </div>
            <div className="mt-4"><SubmitButton variant="danger">Vô hiệu phiếu</SubmitButton></div>
          </ActionForm>
        </Card>
      )}

      <Card title="Tra cứu phiếu">
        <form className="mb-4 flex flex-wrap items-end gap-3" method="get">
          <Field label="Số seri"><Input name="serial" type="number" min={1} defaultValue={serial} className="w-32" /></Field>
          <Field label="Trạng thái">
            <Select name="status" defaultValue={status ?? ''} className="w-40">
              <option value="">Tất cả</option>
              {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </Select>
          </Field>
          <button className="rounded-lg bg-zinc-800 px-4 py-2 text-sm text-white">Lọc</button>
        </form>
        <Table>
          <thead>
            <tr><th>Seri</th><th>Trạng thái</th><th>Lô</th><th>Giáo khu</th><th>Thời điểm dùng</th><th>Bình chọn cho</th></tr>
          </thead>
          <tbody>
            {tokens.map((t) => (
              <tr key={t.id}>
                <td className="font-mono">{formatSerial(t.serial)}</td>
                <td>
                  <Badge tone={STATUS[t.status].tone}>{STATUS[t.status].label}</Badge>
                  {t.revokeReason && <span className="ml-2 text-xs text-zinc-500">{t.revokeReason}</span>}
                </td>
                <td className="text-zinc-600">{t.batch.label}</td>
                <td className="text-zinc-600">{t.zone?.name ?? '—'}</td>
                <td className="text-zinc-600">{formatDateTime(t.usedAt)}</td>
                <td>
                  {t.vote ? (
                    <>
                      {t.vote.product.name}
                      {t.vote.status === 'INVALIDATED' && <Badge tone="red">Đã hủy</Badge>}
                    </>
                  ) : '—'}
                </td>
              </tr>
            ))}
            {tokens.length === 0 && <tr><td colSpan={6} className="py-6 text-center text-zinc-500">Không có phiếu phù hợp.</td></tr>}
          </tbody>
        </Table>
        <Pagination page={page} totalPages={Math.ceil(total / PAGE_SIZE)} makeHref={makeHref} />
      </Card>
    </div>
  );
}

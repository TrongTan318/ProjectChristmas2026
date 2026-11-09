import type { Prisma } from '@prisma/client';
import { ActionForm, SubmitButton } from '@/components/admin/ActionForm';
import { Badge, Card, Field, Input, PageHeader, Pagination, Select, Table } from '@/components/admin/ui';
import { formatSerial } from '@/domain/token';
import { formatDateTime } from '@/lib/format';
import { isSuperAdmin, requireAdmin } from '@/server/auth';
import { requireActiveContest } from '@/server/contest';
import { prisma } from '@/server/db';
import { invalidateVote, resetVote } from './actions';

const PAGE_SIZE = 50;
/** Nhiều phiếu từ cùng một IP: nghi vấn (Wi-Fi nhà thờ dùng chung IP nên chỉ để tham khảo). */
const SUSPICIOUS_PER_IP = 15;

type Search = { product?: string; status?: string; suspicious?: string; serial?: string; page?: string };

export default async function VotesPage({ searchParams }: { searchParams: Promise<Search> }) {
  const user = await requireAdmin();
  const superAdmin = isSuperAdmin(user);
  const contest = await requireActiveContest();
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);

  const ipGroups = await prisma.vote.groupBy({
    by: ['ipHash'],
    where: { contestId: contest.id, deletedAt: null, ipHash: { not: null } },
    _count: { _all: true },
    having: { ipHash: { _count: { gte: SUSPICIOUS_PER_IP } } },
  });
  const suspiciousIps = new Set(ipGroups.map((g) => g.ipHash!));
  const serial = sp.serial && /^\d+$/.test(sp.serial.trim()) ? Number(sp.serial.trim()) : undefined;

  const where: Prisma.VoteWhereInput = {
    contestId: contest.id,
    deletedAt: null,
    token: serial !== undefined ? { serial } : undefined,
    productId: sp.product || undefined,
    status: sp.status === 'VALID' || sp.status === 'INVALIDATED' ? sp.status : undefined,
    ipHash: sp.suspicious ? { in: [...suspiciousIps] } : undefined,
  };

  const [votes, total, products] = await Promise.all([
    prisma.vote.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { product: { select: { name: true } }, token: { select: { serial: true } }, zone: { select: { name: true } } },
    }),
    prisma.vote.count({ where }),
    prisma.product.findMany({ where: { contestId: contest.id, deletedAt: null }, orderBy: { name: 'asc' }, select: { id: true, name: true } }),
  ]);

  const makeHref = (p: number) =>
    `/admin/votes?${new URLSearchParams({ ...(sp.product ? { product: sp.product } : {}), ...(sp.status ? { status: sp.status } : {}), ...(sp.suspicious ? { suspicious: '1' } : {}), ...(sp.serial ? { serial: sp.serial } : {}), page: String(p) })}`;

  return (
    <div className="space-y-6">
      <PageHeader title="Phiếu bầu" description={`${total} phiếu phù hợp bộ lọc`} />

      {ipGroups.length > 0 && (
        <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
          ⚠ Có {ipGroups.length} địa chỉ mạng gửi từ {SUSPICIOUS_PER_IP} phiếu trở lên. Nếu đó là Wi-Fi nhà thờ thì là bình thường; hãy đối chiếu với thời gian và số seri trước khi hủy phiếu.
        </p>
      )}

      {superAdmin && (
        <Card>
          <h2 id="go-phieu" className="font-semibold">Gỡ phiếu (bầu nhầm / phiếu thử)</h2>
          <p className="mt-1 text-sm text-zinc-600">
            Nhập số seri in trên phiếu. Lượt bầu của phiếu đó bị xóa, phiếu quét hoặc nhập mã lại được như mới.
          </p>
          <ActionForm
            action={resetVote}
            className="mt-3 flex flex-wrap items-end gap-3"
            confirmMessage="Gỡ phiếu này? Lượt bầu sẽ bị xóa và phiếu dùng lại được."
          >
            <Field label="Số seri *">
              <Input name="serial" required defaultValue={sp.serial ?? ''} inputMode="numeric" placeholder="vd. 0123" className="w-32" />
            </Field>
            <Field label="Lý do *">
              <Input name="reason" required placeholder="vd. bầu nhầm, phiếu thử" maxLength={300} className="w-64" />
            </Field>
            <Field label="Mật khẩu của bạn *">
              <Input name="password" type="password" required autoComplete="current-password" className="w-48" />
            </Field>
            <SubmitButton>Gỡ để dùng lại</SubmitButton>
          </ActionForm>
        </Card>
      )}

      <form className="flex flex-wrap items-end gap-3" method="get">
        <Field label="Số seri">
          <Input name="serial" defaultValue={sp.serial ?? ''} inputMode="numeric" placeholder="vd. 0123" className="w-32" />
        </Field>
        <Field label="Sản phẩm">
          <Select name="product" defaultValue={sp.product ?? ''} className="w-56">
            <option value="">Tất cả</option>
            {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </Select>
        </Field>
        <Field label="Trạng thái">
          <Select name="status" defaultValue={sp.status ?? ''} className="w-40">
            <option value="">Tất cả</option>
            <option value="VALID">Hợp lệ</option>
            <option value="INVALIDATED">Đã hủy</option>
          </Select>
        </Field>
        <label className="flex items-center gap-2 pb-2 text-sm">
          <input type="checkbox" name="suspicious" value="1" defaultChecked={!!sp.suspicious} className="accent-burgundy" /> Chỉ phiếu nghi vấn
        </label>
        <button className="rounded-lg bg-zinc-800 px-4 py-2 text-sm text-white">Lọc</button>
      </form>

      <Table>
        <thead>
          <tr><th>Thời gian</th><th>Seri</th><th>Sản phẩm</th><th>Giáo khu</th><th>Trạng thái</th><th>Thiết bị</th>{superAdmin && <th>Thao tác</th>}</tr>
        </thead>
        <tbody>
          {votes.map((v) => (
            <tr key={v.id} className={v.ipHash && suspiciousIps.has(v.ipHash) ? 'bg-amber-50/60' : undefined}>
              <td className="whitespace-nowrap text-zinc-600">{formatDateTime(v.createdAt)}</td>
              <td className="font-mono">{formatSerial(v.token.serial)}</td>
              <td className="font-medium">{v.product.name}</td>
              <td className="text-zinc-600">{v.zone?.name ?? '—'}</td>
              <td>
                {v.status === 'VALID' ? <Badge tone="green">Hợp lệ</Badge> : <Badge tone="red">Đã hủy</Badge>}
                {v.invalidReason && <p className="mt-1 text-xs text-zinc-500">{v.invalidReason}</p>}
              </td>
              <td className="max-w-48 truncate text-xs text-zinc-500" title={v.userAgent ?? ''}>
                {v.ipHash ? `#${v.ipHash.slice(0, 6)}` : ''} {v.userAgent?.slice(0, 40)}
              </td>
              {superAdmin && (
                <td className="space-y-1">
                  {/* Điền sẵn seri vào ô "Gỡ phiếu" ở đầu trang */}
                  <a href={`/admin/votes?serial=${formatSerial(v.token.serial)}#go-phieu`} className="block text-sm text-blue-700 hover:underline">
                    Gỡ phiếu…
                  </a>
                  {/* Hủy: gian lận → không tính phiếu, phiếu khóa vĩnh viễn */}
                  {v.status === 'VALID' && (
                    <details>
                      <summary className="cursor-pointer text-sm text-red-600">Hủy…</summary>
                      <ActionForm action={invalidateVote} className="mt-2 w-64 space-y-2" confirmMessage="Hủy phiếu bầu này?">
                        <input type="hidden" name="id" value={v.id} />
                        <Input name="reason" required placeholder="Lý do hủy" maxLength={300} />
                        <Input name="password" type="password" required placeholder="Mật khẩu xác nhận" autoComplete="current-password" />
                        <SubmitButton variant="danger">Xác nhận hủy</SubmitButton>
                      </ActionForm>
                    </details>
                  )}
                </td>
              )}
            </tr>
          ))}
          {votes.length === 0 && <tr><td colSpan={7} className="py-8 text-center text-zinc-500">Chưa có phiếu bầu.</td></tr>}
        </tbody>
      </Table>
      <Pagination page={page} totalPages={Math.ceil(total / PAGE_SIZE)} makeHref={makeHref} />
      <Card>
        <p className="text-sm text-zinc-600">
          <strong>Gỡ phiếu</strong>: dùng khi người dân bầu nhầm hoặc phiếu thử nghiệm — xóa lượt bầu, phiếu quét lại được.{' '}
          <strong>Hủy</strong>: dùng khi gian lận — phiếu không được tính và khóa vĩnh viễn. Cả hai đều cần mật khẩu và được ghi vào Nhật ký.
        </p>
        <p className="mt-2 text-sm text-zinc-600">
          Hệ thống không lưu địa chỉ IP thô — chỉ lưu mã băm (#xxxxxx) để phát hiện nhiều phiếu từ cùng một mạng.
        </p>
      </Card>
    </div>
  );
}

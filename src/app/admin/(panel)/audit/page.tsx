import { PageHeader, Pagination, Table } from '@/components/admin/ui';
import { formatDateTime } from '@/lib/format';
import { requireSuperAdmin } from '@/server/auth';
import { prisma } from '@/server/db';

const PAGE_SIZE = 50;

export default async function AuditPage({ searchParams }: { searchParams: Promise<{ page?: string; action?: string }> }) {
  await requireSuperAdmin();
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const where = sp.action ? { action: { startsWith: sp.action } } : {};
  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { user: { select: { name: true, email: true } } },
    }),
    prisma.auditLog.count({ where }),
  ]);

  return (
    <div>
      <PageHeader title="Nhật ký hệ thống" description="Mọi thao tác thay đổi dữ liệu của quản trị viên (chỉ ghi thêm, không sửa/xóa)." />
      <form method="get" className="mb-4 flex gap-2">
        <input name="action" defaultValue={sp.action} placeholder="Lọc theo hành động (vd: voting, token, vote)" className="w-80 rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
        <button className="rounded-lg bg-zinc-800 px-4 py-2 text-sm text-white">Lọc</button>
      </form>
      <Table>
        <thead>
          <tr><th>Thời gian</th><th>Người thực hiện</th><th>Hành động</th><th>Đối tượng</th><th>Chi tiết</th></tr>
        </thead>
        <tbody>
          {logs.map((l) => (
            <tr key={l.id}>
              <td className="whitespace-nowrap text-zinc-600">{formatDateTime(l.createdAt)}</td>
              <td>{l.user?.name ?? 'Hệ thống'}</td>
              <td className="font-mono text-xs">{l.action}</td>
              <td className="text-xs text-zinc-600">{l.entityType}{l.entityId ? ` · ${l.entityId.slice(0, 10)}` : ''}</td>
              <td className="max-w-md">
                {(l.before || l.after) && (
                  <details>
                    <summary className="cursor-pointer text-xs text-burgundy">Xem</summary>
                    <pre className="mt-2 max-h-60 overflow-auto rounded bg-zinc-50 p-2 text-[11px] leading-snug whitespace-pre-wrap">
                      {JSON.stringify({ before: l.before, after: l.after }, null, 2)}
                    </pre>
                  </details>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
      <Pagination page={page} totalPages={Math.ceil(total / PAGE_SIZE)} makeHref={(p) => `/admin/audit?${new URLSearchParams({ ...(sp.action ? { action: sp.action } : {}), page: String(p) })}`} />
    </div>
  );
}

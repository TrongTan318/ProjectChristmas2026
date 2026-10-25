import { ActionForm, SubmitButton } from '@/components/admin/ActionForm';
import { Card, Field, Input, PageHeader } from '@/components/admin/ui';
import { requireAdmin } from '@/server/auth';
import { prisma } from '@/server/db';
import { deleteZone, saveZone } from './actions';

export default async function ZonesPage() {
  await requireAdmin();
  const zones = await prisma.zone.findMany({
    where: { deletedAt: null },
    orderBy: { sortOrder: 'asc' },
    include: { _count: { select: { tokens: true, votes: { where: { status: 'VALID' } } } } },
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Giáo khu" description="Gán giáo khu cho từng lô phiếu khi phân phát để thống kê phiếu theo giáo khu." />
      <Card title="Thêm giáo khu">
        <ActionForm action={saveZone} resetOnSuccess className="flex flex-wrap items-end gap-3">
          <Field label="Tên giáo khu"><Input name="name" required maxLength={120} placeholder="Giáo khu Thánh Giuse" /></Field>
          <Field label="Thứ tự"><Input name="sortOrder" type="number" min={0} defaultValue={zones.length + 1} className="w-24" /></Field>
          <SubmitButton>+ Thêm</SubmitButton>
        </ActionForm>
      </Card>
      <div className="space-y-2">
        {zones.map((z) => (
          <div key={z.id} className="flex flex-wrap items-end gap-3 rounded-xl border border-zinc-200 bg-white p-4">
            <ActionForm action={saveZone} className="flex flex-1 flex-wrap items-end gap-3">
              <input type="hidden" name="id" value={z.id} />
              <Field label="Tên"><Input name="name" required defaultValue={z.name} maxLength={120} /></Field>
              <Field label="Thứ tự"><Input name="sortOrder" type="number" min={0} defaultValue={z.sortOrder} className="w-24" /></Field>
              <SubmitButton variant="secondary">Lưu</SubmitButton>
              <span className="pb-2 text-sm text-zinc-500">{z._count.tokens} phiếu phát · {z._count.votes} phiếu bầu</span>
            </ActionForm>
            {z._count.tokens === 0 && (
              <ActionForm action={deleteZone} confirmMessage={`Xóa ${z.name}?`}>
                <input type="hidden" name="id" value={z.id} />
                <SubmitButton variant="ghost" className="!text-red-600">Xóa</SubmitButton>
              </ActionForm>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

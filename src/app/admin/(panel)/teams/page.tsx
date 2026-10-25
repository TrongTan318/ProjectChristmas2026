import Link from 'next/link';
import { ActionForm, SubmitButton } from '@/components/admin/ActionForm';
import { Badge, Card, Field, Input, PageHeader, Textarea, btn } from '@/components/admin/ui';
import { requireAdmin } from '@/server/auth';
import { requireActiveContest } from '@/server/contest';
import { prisma } from '@/server/db';
import { createTeam, deleteTeam, updateTeam } from './actions';

function TeamFields({ team }: { team?: { name: string; className: string; leaderName: string | null; members: string | null; sortOrder: number } }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="Tên đội *">
        <Input name="name" required maxLength={120} defaultValue={team?.name} placeholder="Đội Thiên Thần" />
      </Field>
      <Field label="Lớp *">
        <Input name="className" required maxLength={120} defaultValue={team?.className} placeholder="Lớp 1" />
      </Field>
      <Field label="Huynh trưởng phụ trách">
        <Input name="leaderName" maxLength={200} defaultValue={team?.leaderName ?? ''} />
      </Field>
      <Field label="Thứ tự hiển thị">
        <Input name="sortOrder" type="number" min={0} defaultValue={team?.sortOrder ?? 0} />
      </Field>
      <Field label="Thành viên" hint="Mỗi dòng một tên (tùy chọn)" className="sm:col-span-2">
        <Textarea name="members" rows={3} maxLength={3000} defaultValue={team?.members ?? ''} />
      </Field>
    </div>
  );
}

export default async function TeamsPage() {
  await requireAdmin();
  const contest = await requireActiveContest();
  const teams = await prisma.team.findMany({
    where: { contestId: contest.id, deletedAt: null },
    orderBy: [{ sortOrder: 'asc' }, { className: 'asc' }],
    include: { product: { select: { id: true, name: true, status: true, deletedAt: true } } },
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Đội thi" description={`${teams.length} đội · mỗi đội có 1 sản phẩm chính`} />

      <Card title="Thêm đội mới">
        <ActionForm action={createTeam} resetOnSuccess>
          <TeamFields />
          <div className="mt-4">
            <SubmitButton>+ Thêm đội</SubmitButton>
          </div>
        </ActionForm>
      </Card>

      <div className="space-y-3">
        {teams.map((t) => {
          const product = t.product && !t.product.deletedAt ? t.product : null;
          return (
            <details key={t.id} className="group rounded-xl border border-zinc-200 bg-white shadow-sm">
              <summary className="flex cursor-pointer list-none items-center gap-3 px-5 py-3">
                <span className="w-16 shrink-0 text-sm text-zinc-500">{t.className}</span>
                <span className="flex-1 font-medium">{t.name}</span>
                {product ? (
                  <Link href={`/admin/products/${product.id}`} className="text-sm text-burgundy hover:underline">
                    {product.name} {product.status === 'PUBLISHED' ? <Badge tone="green">Đã xuất bản</Badge> : <Badge tone="amber">Nháp</Badge>}
                  </Link>
                ) : (
                  <Badge tone="red">Chưa có sản phẩm</Badge>
                )}
                <span className="text-zinc-400 group-open:rotate-90">›</span>
              </summary>
              <div className="border-t border-zinc-100 p-5">
                <ActionForm action={updateTeam}>
                  <input type="hidden" name="id" value={t.id} />
                  <TeamFields team={t} />
                  <div className="mt-4 flex gap-2">
                    <SubmitButton>Lưu thay đổi</SubmitButton>
                    {!product && (
                      <Link href={`/admin/products/new?team=${t.id}`} className={btn.secondary}>+ Tạo sản phẩm</Link>
                    )}
                  </div>
                </ActionForm>
                <ActionForm action={deleteTeam} confirmMessage={`Xóa đội “${t.name}”?`} className="mt-3">
                  <input type="hidden" name="id" value={t.id} />
                  <SubmitButton variant="ghost" className="!text-red-600">Xóa đội</SubmitButton>
                </ActionForm>
              </div>
            </details>
          );
        })}
      </div>
    </div>
  );
}

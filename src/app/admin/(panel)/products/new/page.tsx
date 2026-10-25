import Link from 'next/link';
import { ActionForm, SubmitButton } from '@/components/admin/ActionForm';
import { Card, Field, Input, PageHeader, Select, btn } from '@/components/admin/ui';
import { requireAdmin } from '@/server/auth';
import { requireActiveContest } from '@/server/contest';
import { prisma } from '@/server/db';
import { createProduct } from '../actions';

export default async function NewProductPage({ searchParams }: { searchParams: Promise<{ team?: string }> }) {
  await requireAdmin();
  const { team } = await searchParams;
  const contest = await requireActiveContest();
  const teams = await prisma.team.findMany({
    where: { contestId: contest.id, deletedAt: null, product: null },
    orderBy: [{ sortOrder: 'asc' }, { className: 'asc' }],
  });

  return (
    <div className="max-w-xl">
      <PageHeader title="Thêm sản phẩm" />
      <Card>
        {teams.length === 0 ? (
          <p className="text-sm text-zinc-600">
            Tất cả các đội đều đã có sản phẩm. <Link href="/admin/teams" className={btn.ghost}>Thêm đội mới →</Link>
          </p>
        ) : (
          <ActionForm action={createProduct} className="space-y-4">
            <Field label="Đội *">
              <Select name="teamId" required defaultValue={team ?? ''}>
                <option value="" disabled>— Chọn đội —</option>
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>{t.className} · {t.name}</option>
                ))}
              </Select>
            </Field>
            <Field label="Tên sản phẩm *">
              <Input name="name" required maxLength={160} placeholder="Hang đá Bêlem yêu thương" />
            </Field>
            <SubmitButton>Tạo và tiếp tục nhập nội dung →</SubmitButton>
          </ActionForm>
        )}
      </Card>
    </div>
  );
}

import { ActionForm, SubmitButton } from '@/components/admin/ActionForm';
import { ImageField } from '@/components/admin/ImageField';
import { Card, Checkbox, Field, Input, PageHeader } from '@/components/admin/ui';
import { requireAdmin } from '@/server/auth';
import { requireActiveContest } from '@/server/contest';
import { prisma } from '@/server/db';
import { deleteContent, saveSponsor } from '../content-actions';

type Sponsor = Awaited<ReturnType<typeof prisma.sponsor.findMany>>[number];

function SponsorForm({ sponsor }: { sponsor?: Sponsor }) {
  return (
    <ActionForm action={saveSponsor} resetOnSuccess={!sponsor} className="space-y-4">
      {sponsor && <input type="hidden" name="id" value={sponsor.id} />}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Tên *"><Input name="name" required maxLength={160} defaultValue={sponsor?.name} /></Field>
        <Field label="Hạng" hint="VD: Kim cương, Vàng, Đồng hành"><Input name="tier" maxLength={60} defaultValue={sponsor?.tier} /></Field>
        <Field label="Website"><Input name="url" maxLength={300} defaultValue={sponsor?.url ?? ''} placeholder="https://" /></Field>
        <Field label="Thứ tự"><Input name="sortOrder" type="number" min={0} defaultValue={sponsor?.sortOrder ?? 0} /></Field>
      </div>
      <ImageField name="logoKey" defaultKey={sponsor?.logoKey} label="Logo (nên dùng PNG nền trong suốt)" />
      <Checkbox name="isActive" label="Hiển thị" defaultChecked={sponsor?.isActive ?? true} />
      <div><SubmitButton>{sponsor ? 'Lưu' : '+ Thêm nhà tài trợ'}</SubmitButton></div>
    </ActionForm>
  );
}

export default async function SponsorsPage() {
  await requireAdmin();
  const contest = await requireActiveContest();
  const sponsors = await prisma.sponsor.findMany({ where: { contestId: contest.id, deletedAt: null }, orderBy: { sortOrder: 'asc' } });
  return (
    <div className="space-y-6">
      <PageHeader title="Nhà tài trợ" />
      <Card title="Thêm nhà tài trợ"><SponsorForm /></Card>
      {sponsors.map((s) => (
        <Card key={s.id} title={s.name}>
          <SponsorForm sponsor={s} />
          <ActionForm action={deleteContent} confirmMessage="Xóa nhà tài trợ này?" className="mt-2">
            <input type="hidden" name="type" value="sponsor" />
            <input type="hidden" name="id" value={s.id} />
            <SubmitButton variant="ghost" className="!text-red-600">Xóa</SubmitButton>
          </ActionForm>
        </Card>
      ))}
    </div>
  );
}

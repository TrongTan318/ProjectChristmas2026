import { ActionForm, SubmitButton } from '@/components/admin/ActionForm';
import { ImageField } from '@/components/admin/ImageField';
import { Card, Checkbox, Field, Input, PageHeader } from '@/components/admin/ui';
import { requireAdmin } from '@/server/auth';
import { requireActiveContest } from '@/server/contest';
import { prisma } from '@/server/db';
import { deleteContent, saveBanner } from '../content-actions';

type Banner = Awaited<ReturnType<typeof prisma.banner.findMany>>[number];

function BannerForm({ banner }: { banner?: Banner }) {
  return (
    <ActionForm action={saveBanner} resetOnSuccess={!banner} className="space-y-4">
      {banner && <input type="hidden" name="id" value={banner.id} />}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Tiêu đề *"><Input name="title" required maxLength={200} defaultValue={banner?.title} /></Field>
        <Field label="Phụ đề"><Input name="subtitle" maxLength={400} defaultValue={banner?.subtitle} /></Field>
        <Field label="Nút — chữ"><Input name="ctaLabel" maxLength={60} defaultValue={banner?.ctaLabel} placeholder="Vào triển lãm" /></Field>
        <Field label="Nút — liên kết"><Input name="ctaUrl" maxLength={300} defaultValue={banner?.ctaUrl} placeholder="/trien-lam" /></Field>
        <Field label="Thứ tự"><Input name="sortOrder" type="number" min={0} defaultValue={banner?.sortOrder ?? 0} /></Field>
        <div className="flex items-end pb-2"><Checkbox name="isActive" label="Hiển thị" defaultChecked={banner?.isActive ?? true} /></div>
      </div>
      <ImageField name="imageKey" defaultKey={banner?.imageKey} label="Ảnh nền (nên dùng ảnh ngang ≥ 1600px)" />
      <SubmitButton>{banner ? 'Lưu' : '+ Thêm banner'}</SubmitButton>
    </ActionForm>
  );
}

export default async function BannersPage() {
  await requireAdmin();
  const contest = await requireActiveContest();
  const banners = await prisma.banner.findMany({ where: { contestId: contest.id, deletedAt: null }, orderBy: { sortOrder: 'asc' } });
  return (
    <div className="space-y-6">
      <PageHeader title="Banner trang chủ" description="Nếu không có banner nào, trang chủ dùng tiêu đề trong Cài đặt." />
      <Card title="Thêm banner"><BannerForm /></Card>
      {banners.map((b) => (
        <Card key={b.id} title={b.title}>
          <BannerForm banner={b} />
          <ActionForm action={deleteContent} confirmMessage="Xóa banner này?" className="mt-2">
            <input type="hidden" name="type" value="banner" />
            <input type="hidden" name="id" value={b.id} />
            <SubmitButton variant="ghost" className="!text-red-600">Xóa banner</SubmitButton>
          </ActionForm>
        </Card>
      ))}
    </div>
  );
}

import { ActionForm, SubmitButton } from '@/components/admin/ActionForm';
import { ImageField } from '@/components/admin/ImageField';
import { Badge, Card, Checkbox, Field, Input, PageHeader, Textarea } from '@/components/admin/ui';
import { formatDate } from '@/lib/format';
import { requireAdmin } from '@/server/auth';
import { requireActiveContest } from '@/server/contest';
import { prisma } from '@/server/db';
import { deleteContent, saveAnnouncement } from '../content-actions';

type Item = Awaited<ReturnType<typeof prisma.announcement.findMany>>[number];

function NewsForm({ item }: { item?: Item }) {
  return (
    <ActionForm action={saveAnnouncement} resetOnSuccess={!item} className="space-y-4">
      {item && <input type="hidden" name="id" value={item.id} />}
      <Field label="Tiêu đề *"><Input name="title" required maxLength={200} defaultValue={item?.title} /></Field>
      <Field label="Tóm tắt"><Textarea name="excerpt" rows={2} maxLength={500} defaultValue={item?.excerpt} /></Field>
      <Field label="Nội dung" hint="Xuống dòng 2 lần để tách đoạn"><Textarea name="content" rows={8} maxLength={30000} defaultValue={item?.content} /></Field>
      <ImageField name="coverKey" defaultKey={item?.coverKey} label="Ảnh bìa" />
      <Checkbox name="isPublished" label="Xuất bản" defaultChecked={item?.isPublished ?? false} />
      <div><SubmitButton>{item ? 'Lưu' : '+ Thêm tin'}</SubmitButton></div>
    </ActionForm>
  );
}

export default async function NewsAdminPage() {
  await requireAdmin();
  const contest = await requireActiveContest();
  const items = await prisma.announcement.findMany({ where: { contestId: contest.id, deletedAt: null }, orderBy: { createdAt: 'desc' } });
  return (
    <div className="space-y-6">
      <PageHeader title="Tin tức" />
      <Card title="Thêm tin mới"><NewsForm /></Card>
      {items.map((n) => (
        <details key={n.id} className="rounded-xl border border-zinc-200 bg-white shadow-sm">
          <summary className="flex cursor-pointer list-none items-center gap-3 px-5 py-3">
            <span className="flex-1 font-medium">{n.title}</span>
            {n.isPublished ? <Badge tone="green">Đã xuất bản {formatDate(n.publishedAt)}</Badge> : <Badge tone="amber">Nháp</Badge>}
          </summary>
          <div className="border-t border-zinc-100 p-5">
            <NewsForm item={n} />
            <ActionForm action={deleteContent} confirmMessage="Xóa tin này?" className="mt-2">
              <input type="hidden" name="type" value="announcement" />
              <input type="hidden" name="id" value={n.id} />
              <SubmitButton variant="ghost" className="!text-red-600">Xóa tin</SubmitButton>
            </ActionForm>
          </div>
        </details>
      ))}
    </div>
  );
}

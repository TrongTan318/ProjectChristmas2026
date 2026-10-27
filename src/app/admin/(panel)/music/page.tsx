import { ActionForm, SubmitButton } from '@/components/admin/ActionForm';
import { Badge, Card, Checkbox, Field, Input, PageHeader } from '@/components/admin/ui';
import { fileUrl } from '@/lib/media';
import { requireAdmin } from '@/server/auth';
import { requireActiveContest } from '@/server/contest';
import { prisma } from '@/server/db';
import { updateMusicTrack } from './actions';
import { DeleteTrackButton } from './DeleteTrackButton';
import { MusicUploader } from './MusicUploader';

export default async function MusicPage() {
  await requireAdmin();
  const contest = await requireActiveContest();
  const tracks = await prisma.musicTrack.findMany({
    where: { contestId: contest.id, deletedAt: null },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
  });
  const activeCount = tracks.filter((t) => t.isActive).length;
  const totalMb = tracks.reduce((s, t) => s + t.sizeBytes, 0) / 1024 / 1024;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Nhạc nền"
        description="Website phát ngẫu nhiên các bài đang bật, nối bài liên tục. Tệp lưu trên server (không nằm trong source code)."
      />
      <Card title="Tải nhạc lên">
        <MusicUploader />
      </Card>
      <Card title={`Danh sách (${activeCount}/${tracks.length} bài đang bật · ${totalMb.toFixed(1)} MB)`}>
        {tracks.length === 0 && <p className="text-sm text-zinc-500">Chưa có bài nào. Website sẽ không hiện nút nhạc.</p>}
        <ul className="divide-y divide-zinc-100">
          {tracks.map((t) => (
            <li key={t.id} className="py-4">
              <ActionForm action={updateMusicTrack} className="grid gap-3 sm:grid-cols-[1fr_6rem_auto_auto] sm:items-end">
                <input type="hidden" name="id" value={t.id} />
                <Field label="Tên bài"><Input name="title" required maxLength={200} defaultValue={t.title} /></Field>
                <Field label="Thứ tự"><Input name="sortOrder" type="number" min={0} max={999} defaultValue={t.sortOrder} /></Field>
                <div className="pb-2"><Checkbox name="isActive" label="Phát trên web" defaultChecked={t.isActive} /></div>
                <SubmitButton variant="secondary">Lưu</SubmitButton>
              </ActionForm>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <audio controls preload="none" src={fileUrl(t.fileKey)} className="h-9 max-w-full" />
                <span className="text-xs text-zinc-500">{(t.sizeBytes / 1024 / 1024).toFixed(1)} MB</span>
                {!t.isActive && <Badge tone="amber">Đang tắt</Badge>}
                <span className="flex-1" />
                <DeleteTrackButton id={t.id} title={t.title} />
              </div>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

import { ActionForm, SubmitButton } from '@/components/admin/ActionForm';
import { Card, Checkbox, Field, Input, PageHeader, Textarea } from '@/components/admin/ui';
import { getVotingState } from '@/domain/voting';
import { toLocalInput } from '@/lib/format';
import { isSuperAdmin, requireAdmin } from '@/server/auth';
import { getSiteSettings, requireActiveContest } from '@/server/contest';
import { setResultsVisibility, setVotingStatus, updateContest, updateSiteSettings } from './actions';

function PasswordConfirm() {
  return (
    <Field label="Mật khẩu của bạn (xác nhận) *">
      <Input name="password" type="password" required autoComplete="current-password" className="max-w-xs" />
    </Field>
  );
}

export default async function SettingsPage() {
  const user = await requireAdmin();
  const superAdmin = isSuperAdmin(user);
  const contest = await requireActiveContest();
  const settings = await getSiteSettings(contest.id);
  const state = getVotingState(contest);

  return (
    <div className="space-y-6">
      <PageHeader title="Cài đặt" />

      {superAdmin && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card title="Trạng thái bình chọn">
            <p className="mb-4 text-sm">
              Hiện tại:{' '}
              <strong className={contest.votingStatus === 'OPEN' ? 'text-emerald-700' : 'text-red-700'}>
                {contest.votingStatus === 'OPEN' ? 'MỞ' : 'KHÓA'}
              </strong>
              {contest.votingStatus === 'OPEN' && state !== 'OPEN' && (
                <span className="ml-2 text-amber-700">({state === 'NOT_STARTED' ? 'chưa đến giờ mở' : 'đã quá giờ đóng'} — phiếu chưa được nhận)</span>
              )}
            </p>
            <ActionForm
              action={setVotingStatus}
              className="space-y-3"
              confirmMessage={contest.votingStatus === 'OPEN' ? 'KHÓA bình chọn ngay bây giờ?' : 'MỞ bình chọn ngay bây giờ?'}
            >
              <input type="hidden" name="status" value={contest.votingStatus === 'OPEN' ? 'LOCKED' : 'OPEN'} />
              <Field label="Lý do / ghi chú"><Input name="reason" maxLength={200} /></Field>
              <PasswordConfirm />
              <SubmitButton variant={contest.votingStatus === 'OPEN' ? 'danger' : 'primary'}>
                {contest.votingStatus === 'OPEN' ? '🔒 Khóa bình chọn' : '🔓 Mở bình chọn'}
              </SubmitButton>
            </ActionForm>
            <p className="mt-3 text-xs text-zinc-500">Phiếu chỉ được nhận khi trạng thái MỞ và đang trong khung giờ bình chọn bên dưới.</p>
          </Card>

          <Card title="Hiển thị kết quả">
            <ActionForm action={setResultsVisibility} className="space-y-3">
              <div className="flex flex-col gap-2">
                <Checkbox name="resultsPublic" label="Công khai kết quả trên website" defaultChecked={contest.resultsPublic} />
                <Checkbox name="resultsRealtime" label="Cập nhật realtime (tự làm mới mỗi 10 giây)" defaultChecked={contest.resultsRealtime} />
              </div>
              <PasswordConfirm />
              <SubmitButton>Lưu hiển thị kết quả</SubmitButton>
            </ActionForm>
          </Card>

          <Card title="Thông tin cuộc thi & khung giờ bình chọn" className="lg:col-span-2">
            <ActionForm action={updateContest} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="Tên cuộc thi *"><Input name="name" required defaultValue={contest.name} maxLength={200} /></Field>
                <Field label="Đơn vị tổ chức *"><Input name="organizer" required defaultValue={contest.organizer} maxLength={200} /></Field>
                <Field label="Năm"><Input name="year" type="number" defaultValue={contest.year} /></Field>
                <Field label="Mở bình chọn lúc (giờ VN)"><Input name="votingStartAt" type="datetime-local" defaultValue={toLocalInput(contest.votingStartAt)} /></Field>
                <Field label="Đóng bình chọn lúc (giờ VN)"><Input name="votingEndAt" type="datetime-local" defaultValue={toLocalInput(contest.votingEndAt)} /></Field>
              </div>
              <PasswordConfirm />
              <SubmitButton>Lưu thông tin cuộc thi</SubmitButton>
            </ActionForm>
          </Card>
        </div>
      )}

      <Card title="Nội dung website">
        <ActionForm action={updateSiteSettings} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Tiêu đề lớn (khi chưa có banner)"><Input name="heroTitle" defaultValue={settings.heroTitle} maxLength={200} /></Field>
            <Field label="Phụ đề"><Input name="heroSubtitle" defaultValue={settings.heroSubtitle} maxLength={400} /></Field>
            <Field label="Tiêu đề phần giới thiệu"><Input name="introTitle" defaultValue={settings.introTitle} maxLength={200} /></Field>
            <Field label="Video giới thiệu (link YouTube)"><Input name="introVideoUrl" defaultValue={settings.introVideoUrl} maxLength={300} placeholder="https://www.youtube.com/watch?v=..." /></Field>
          </div>
          <Field label="Nội dung giới thiệu" hint="Xuống dòng 2 lần để tách đoạn"><Textarea name="introBody" rows={6} defaultValue={settings.introBody} maxLength={5000} /></Field>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Điện thoại liên hệ"><Input name="contactPhone" defaultValue={settings.contactPhone} maxLength={50} /></Field>
            <Field label="Email"><Input name="contactEmail" defaultValue={settings.contactEmail} maxLength={120} /></Field>
            <Field label="Địa chỉ"><Input name="address" defaultValue={settings.address} maxLength={300} /></Field>
            <Field label="Facebook"><Input name="facebookUrl" defaultValue={settings.facebookUrl} maxLength={300} /></Field>
            <Field label="YouTube"><Input name="youtubeUrl" defaultValue={settings.youtubeUrl} maxLength={300} /></Field>
            <Field label="Số sản phẩm trong Top"><Input name="rankingTopN" type="number" min={3} max={50} defaultValue={settings.rankingTopN} /></Field>
          </div>
          <Field label="Hướng dẫn hỗ trợ trên trang bình chọn"><Input name="voteHelp" defaultValue={settings.voteHelp} maxLength={500} /></Field>
          <Field label="Mô tả SEO"><Input name="seoDescription" defaultValue={settings.seoDescription} maxLength={300} /></Field>
          <Checkbox name="effectsEnabled" label="Bật hiệu ứng tuyết rơi" defaultChecked={settings.effectsEnabled} />
          <div><SubmitButton>Lưu nội dung website</SubmitButton></div>
        </ActionForm>
      </Card>
    </div>
  );
}

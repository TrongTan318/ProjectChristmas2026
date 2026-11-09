'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Field, Input, Select, btn } from '@/components/admin/ui';

type DownloadFile = { name: string; url: string };

function base64ToBlob(data: string, type: string) {
  const bin = atob(data);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type });
}

function download(file: DownloadFile) {
  const a = document.createElement('a');
  a.href = file.url;
  a.download = file.name;
  a.click();
}

export function TokenBatchForm({ zones }: { zones: { id: string; name: string }[] }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  // Giữ file trong bộ nhớ trình duyệt tới khi rời trang, phòng khi trình duyệt chặn tải nhiều file.
  const [files, setFiles] = useState<DownloadFile[]>([]);

  useEffect(() => () => files.forEach((f) => URL.revokeObjectURL(f.url)), [files]);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    if (!confirm(`Sinh ${data.get('quantity')} phiếu mới? File PDF và Excel chỉ tải được MỘT LẦN — hãy lưu cẩn thận.`)) return;
    setPending(true);
    setMessage(null);
    setFiles([]);
    try {
      const res = await fetch('/api/admin/tokens/batches', { method: 'POST', body: data });
      if (!res.ok) {
        setMessage({ ok: false, text: (await res.json().catch(() => ({}))).error ?? 'Không sinh được phiếu.' });
        return;
      }
      const body = (await res.json()) as { files: { name: string; type: string; data: string }[] };
      const ready = body.files.map((f) => ({ name: f.name, url: URL.createObjectURL(base64ToBlob(f.data, f.type)) }));
      setFiles(ready);
      ready.forEach((f, i) => setTimeout(() => download(f), i * 600));
      setMessage({
        ok: true,
        text: `Đã sinh phiếu và tải về ${ready.map((f) => `“${f.name}”`).join(' và ')}. Nếu thiếu file, bấm nút tải lại bên dưới (chỉ dùng được tới khi rời trang này).`,
      });
      form.reset();
      router.refresh();
    } catch {
      setMessage({ ok: false, text: 'Mất kết nối. Kiểm tra danh sách lô phiếu trước khi thử lại (nếu lô đã được tạo, hãy vô hiệu lô đó rồi tạo lô mới).' });
    } finally {
      setPending(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Số lượng phiếu *">
          <Input name="quantity" type="number" min={1} max={2000} defaultValue={1000} required />
        </Field>
        <Field label="Tên lô *">
          <Input name="label" required maxLength={120} placeholder="Đợt 1 — Thánh lễ Vọng" />
        </Field>
        <Field label="Giáo khu phân phối">
          <Select name="zoneId" defaultValue="">
            <option value="">— Chưa gán —</option>
            {zones.map((z) => <option key={z.id} value={z.id}>{z.name}</option>)}
          </Select>
        </Field>
        <Field label="Mật khẩu của bạn (xác nhận) *">
          <Input name="password" type="password" required autoComplete="current-password" />
        </Field>
      </div>
      <button type="submit" disabled={pending} className={btn.primary}>
        {pending ? 'Đang sinh phiếu, tạo PDF và Excel… (có thể mất 10–60 giây)' : '▦ Sinh phiếu & tải PDF + Excel'}
      </button>
      {message && (
        <p role={message.ok ? 'status' : 'alert'} className={`rounded-lg px-3 py-2 text-sm ${message.ok ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800'}`}>
          {message.text}
        </p>
      )}
      {files.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {files.map((f) => (
            <button key={f.name} type="button" onClick={() => download(f)} className={btn.secondary}>
              ⤓ Tải lại {f.name.endsWith('.pdf') ? 'PDF' : 'Excel'}
            </button>
          ))}
        </div>
      )}
    </form>
  );
}

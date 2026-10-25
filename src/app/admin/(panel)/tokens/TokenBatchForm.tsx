'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Field, Input, Select, btn } from '@/components/admin/ui';

export function TokenBatchForm({ zones }: { zones: { id: string; name: string }[] }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    if (!confirm(`Sinh ${data.get('quantity')} phiếu mới? File PDF chỉ tải được MỘT LẦN — hãy lưu cẩn thận.`)) return;
    setPending(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/tokens/batches', { method: 'POST', body: data });
      if (!res.ok) {
        setMessage({ ok: false, text: (await res.json().catch(() => ({}))).error ?? 'Không sinh được phiếu.' });
        return;
      }
      const blob = await res.blob();
      const name = res.headers.get('Content-Disposition')?.match(/filename="(.+)"/)?.[1] ?? 'phieu-binh-chon.pdf';
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = name;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
      setMessage({ ok: true, text: `Đã sinh phiếu và tải về “${name}”. Hãy lưu file ở nơi an toàn trước khi gửi nhà in.` });
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
        {pending ? 'Đang sinh phiếu và tạo PDF… (có thể mất 10–30 giây)' : '▦ Sinh phiếu & tải PDF'}
      </button>
      {message && (
        <p role={message.ok ? 'status' : 'alert'} className={`rounded-lg px-3 py-2 text-sm ${message.ok ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800'}`}>
          {message.text}
        </p>
      )}
    </form>
  );
}

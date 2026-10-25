'use client';

import { useState } from 'react';
import { mediaUrl } from '@/lib/media';
import { btn } from './ui';

/** Ô chọn ảnh: tải lên ngay, giữ khóa lưu trữ trong input ẩn để form server action gửi đi. */
export function ImageField({ name, defaultKey, label = 'Ảnh' }: { name: string; defaultKey?: string | null; label?: string }) {
  const [key, setKey] = useState(defaultKey ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onFile = async (file: File) => {
    setBusy(true);
    setError(null);
    const body = new FormData();
    body.append('file', file);
    try {
      const res = await fetch('/api/admin/upload', { method: 'POST', body });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) setError(json.error ?? 'Tải ảnh thất bại.');
      else setKey(json.key);
    } catch {
      setError('Mất kết nối.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <span className="mb-1 block text-sm font-medium text-zinc-800">{label}</span>
      <input type="hidden" name={name} value={key} />
      <div className="flex items-center gap-3">
        {key ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={mediaUrl(key, 400)} alt="" className="h-16 w-24 rounded border border-zinc-200 object-cover" />
        ) : (
          <div className="flex h-16 w-24 items-center justify-center rounded border border-dashed border-zinc-300 text-xs text-zinc-400">Chưa có</div>
        )}
        <label className={`${btn.secondary} cursor-pointer ${busy ? 'pointer-events-none opacity-60' : ''}`}>
          {busy ? 'Đang tải…' : key ? 'Đổi ảnh' : 'Chọn ảnh'}
          <input type="file" accept="image/jpeg,image/png,image/webp,image/avif" className="sr-only" onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
        </label>
        {key && (
          <button type="button" className={btn.ghost} onClick={() => setKey('')}>Bỏ ảnh</button>
        )}
      </div>
      {error && <p className="mt-1 text-xs text-red-700">{error}</p>}
    </div>
  );
}

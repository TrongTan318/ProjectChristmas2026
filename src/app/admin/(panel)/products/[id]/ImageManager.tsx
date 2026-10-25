'use client';

import { useRouter } from 'next/navigation';
import { useRef, useState, useTransition } from 'react';
import { btn } from '@/components/admin/ui';
import { mediaUrl } from '@/lib/media';
import { deleteImage, moveImage, setCoverImage, updateImageAlt } from '../actions';

interface Img {
  id: string;
  key: string;
  alt: string;
  isCover: boolean;
}

export function ImageManager({ productId, images, max }: { productId: string; images: Img[]; max: number }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<string | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [pending, startTransition] = useTransition();

  const upload = async (files: FileList) => {
    const list = Array.from(files).slice(0, Math.max(0, max - images.length));
    const errs: string[] = [];
    for (let i = 0; i < list.length; i++) {
      const file = list[i]!;
      setProgress(`Đang tải ảnh ${i + 1}/${list.length}: ${file.name}`);
      const body = new FormData();
      body.append('file', file);
      try {
        const res = await fetch(`/api/admin/products/${productId}/images`, { method: 'POST', body });
        if (!res.ok) errs.push(`${file.name}: ${(await res.json().catch(() => ({}))).error ?? 'Lỗi tải lên'}`);
      } catch {
        errs.push(`${file.name}: mất kết nối`);
      }
    }
    if (files.length > list.length) errs.push(`Chỉ tải được tối đa ${max} ảnh, đã bỏ qua ${files.length - list.length} ảnh.`);
    setErrors(errs);
    setProgress(null);
    if (inputRef.current) inputRef.current.value = '';
    router.refresh();
  };

  const run = (fn: () => Promise<void>) =>
    startTransition(async () => {
      try {
        await fn();
        setErrors([]);
      } catch (e) {
        setErrors([e instanceof Error ? e.message : 'Có lỗi xảy ra']);
      }
      router.refresh();
    });

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <label className={`${btn.primary} cursor-pointer ${images.length >= max || progress ? 'pointer-events-none opacity-60' : ''}`}>
          + Tải ảnh lên
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            multiple
            className="sr-only"
            disabled={images.length >= max || !!progress}
            onChange={(e) => e.target.files && upload(e.target.files)}
          />
        </label>
        <span className="text-sm text-zinc-500">JPG/PNG/WebP, tối đa 15MB/ảnh. Ảnh được tự động tối ưu và xóa thông tin vị trí GPS.</span>
      </div>
      {progress && <p className="mt-3 text-sm text-sky-700" role="status">{progress}</p>}
      {errors.length > 0 && (
        <ul className="mt-3 space-y-1 rounded-lg bg-red-50 p-3 text-sm text-red-800" role="alert">
          {errors.map((e, i) => <li key={i}>{e}</li>)}
        </ul>
      )}

      <ul className={`mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 ${pending ? 'opacity-60' : ''}`}>
        {images.map((img, i) => (
          <li key={img.id} className={`overflow-hidden rounded-lg border ${img.isCover ? 'border-amber-400 ring-2 ring-amber-300' : 'border-zinc-200'}`}>
            <div className="relative aspect-[4/3] bg-zinc-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={mediaUrl(img.key, 400)} alt={img.alt} className="h-full w-full object-cover" />
              {img.isCover && <span className="absolute top-2 left-2 rounded bg-amber-400 px-2 py-0.5 text-xs font-semibold text-ink">Ảnh đại diện</span>}
            </div>
            <div className="space-y-2 p-2">
              <form action={(fd) => run(() => updateImageAlt(img.id, fd))} className="flex gap-1">
                <input name="alt" defaultValue={img.alt} placeholder="Mô tả ảnh (alt)" maxLength={200} className="min-w-0 flex-1 rounded border border-zinc-300 px-2 py-1 text-xs" />
                <button className={btn.ghost} title="Lưu mô tả">💾</button>
              </form>
              <div className="flex flex-wrap items-center gap-1">
                <button type="button" className={btn.ghost} disabled={i === 0} onClick={() => run(() => moveImage(img.id, -1))} title="Lên trước">←</button>
                <button type="button" className={btn.ghost} disabled={i === images.length - 1} onClick={() => run(() => moveImage(img.id, 1))} title="Ra sau">→</button>
                {!img.isCover && (
                  <button type="button" className={btn.ghost} onClick={() => run(() => setCoverImage(img.id))}>★ Đại diện</button>
                )}
                <button
                  type="button"
                  className={`${btn.ghost} ml-auto !text-red-600`}
                  onClick={() => confirm('Xóa ảnh này?') && run(() => deleteImage(img.id))}
                >
                  Xóa
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
      {images.length === 0 && <p className="mt-4 text-sm text-zinc-500">Chưa có ảnh. Ảnh đầu tiên sẽ tự động là ảnh đại diện.</p>}
    </div>
  );
}

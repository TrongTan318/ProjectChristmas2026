'use client';

import { useRouter } from 'next/navigation';
import { useRef, useState, useTransition } from 'react';
import { btn } from '@/components/admin/ui';
import { IMAGE_ACCEPT } from '@/lib/image-format';
import { mediaUrl } from '@/lib/media';
import { deleteItemImage, moveItemImage, setMainImage } from '../actions';

interface Img {
  id: string;
  key: string;
  isMain: boolean;
}

/** Vị trí hiển thị của ảnh phụ theo thứ tự (khớp pickSlots trong src/domain/personal-item.ts). */
const SLOT_NAMES = ['Ảnh khung trên', 'Ảnh khung dưới'];

export function ItemImageManager({ itemId, images, max }: { itemId: string; images: Img[]; max: number }) {
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
        const res = await fetch(`/api/admin/personal-items/${itemId}/images`, { method: 'POST', body });
        if (!res.ok) errs.push(`${file.name}: ${(await res.json().catch(() => ({}))).error ?? 'Lỗi tải lên'}`);
      } catch {
        errs.push(`${file.name}: mất kết nối`);
      }
    }
    if (files.length > list.length) errs.push(`Tối đa ${max} ảnh, đã bỏ qua ${files.length - list.length} ảnh.`);
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

  // Ảnh phụ được đánh số theo thứ tự, bỏ qua ảnh chính.
  let extraIndex = 0;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <label className={`${btn.primary} cursor-pointer ${images.length >= max || progress ? 'pointer-events-none opacity-60' : ''}`}>
          + Tải ảnh lên
          <input
            ref={inputRef}
            type="file"
            accept={IMAGE_ACCEPT}
            multiple
            className="sr-only"
            disabled={images.length >= max || !!progress}
            onChange={(e) => e.target.files && upload(e.target.files)}
          />
        </label>
        <span className="text-sm text-zinc-500">{images.length}/{max} ảnh · JPG/PNG/WebP/HEIC (iPhone), tối đa 15MB/ảnh.</span>
      </div>
      {progress && <p className="mt-3 text-sm text-sky-700" role="status">{progress}</p>}
      {errors.length > 0 && (
        <ul className="mt-3 space-y-1 rounded-lg bg-red-50 p-3 text-sm text-red-800" role="alert">
          {errors.map((e, i) => <li key={i}>{e}</li>)}
        </ul>
      )}

      <ul className={`mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 ${pending ? 'opacity-60' : ''}`}>
        {images.map((img, i) => {
          const slot = img.isMain ? '★ Ảnh đại diện' : (SLOT_NAMES[extraIndex] ?? 'Không dùng');
          if (!img.isMain) extraIndex++;
          return (
            <li key={img.id} className={`overflow-hidden rounded-lg border ${img.isMain ? 'border-amber-400 ring-2 ring-amber-300' : 'border-zinc-200'}`}>
              <div className="relative aspect-[4/3] bg-zinc-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={mediaUrl(img.key, 400)} alt="" className="h-full w-full object-cover" />
                <span className={`absolute top-2 left-2 rounded px-2 py-0.5 text-xs font-semibold ${img.isMain ? 'bg-amber-400 text-ink' : 'bg-ink/75 text-ivory'}`}>{slot}</span>
              </div>
              <div className="space-y-2 p-2">
                <div className="flex flex-wrap items-center gap-1">
                  <button type="button" className={btn.ghost} disabled={i === 0} onClick={() => run(() => moveItemImage(img.id, -1))} title="Lên trước">←</button>
                  <button type="button" className={btn.ghost} disabled={i === images.length - 1} onClick={() => run(() => moveItemImage(img.id, 1))} title="Ra sau">→</button>
                  {!img.isMain && <button type="button" className={btn.ghost} onClick={() => run(() => setMainImage(img.id))}>★ Đại diện</button>}
                  <button type="button" className={`${btn.ghost} ml-auto !text-red-600`} onClick={() => confirm('Xóa ảnh này?') && run(() => deleteItemImage(img.id))}>
                    Xóa
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
      {images.length === 0 && <p className="mt-4 text-sm text-zinc-500">Chưa có ảnh. Ảnh đầu tiên tải lên sẽ là ảnh đại diện.</p>}
    </div>
  );
}

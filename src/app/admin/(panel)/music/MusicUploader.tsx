'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { btn } from '@/components/admin/ui';
import { MAX_AUDIO_BYTES } from '@/lib/limits';

/** Tải nhiều tệp nhạc lần lượt; tên bài mặc định lấy từ tên tệp. */
export function MusicUploader() {
  const router = useRouter();
  const [status, setStatus] = useState<string | null>(null);
  const [errors, setErrors] = useState<string[]>([]);

  const uploadOne = (file: File, index: number, total: number) =>
    new Promise<string | null>((resolve) => {
      if (file.size > MAX_AUDIO_BYTES) return resolve(`${file.name}: vượt quá 20MB.`);
      const title = file.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').trim();
      // XHR để hiển thị % tiến độ (fetch chưa hỗ trợ upload progress).
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `/api/admin/music?title=${encodeURIComponent(title)}`);
      xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
      xhr.upload.onprogress = (e) =>
        e.lengthComputable && setStatus(`Đang tải bài ${index + 1}/${total}: ${Math.round((e.loaded / e.total) * 100)}%`);
      xhr.onload = () => {
        if (xhr.status < 300) return resolve(null);
        try {
          resolve(`${file.name}: ${JSON.parse(xhr.responseText).error}`);
        } catch {
          resolve(`${file.name}: tải lên thất bại.`);
        }
      };
      xhr.onerror = () => resolve(`${file.name}: mất kết nối.`);
      xhr.send(file);
    });

  const onFiles = async (files: File[]) => {
    setErrors([]);
    const failed: string[] = [];
    for (const [i, f] of files.entries()) {
      const err = await uploadOne(f, i, files.length);
      if (err) failed.push(err);
    }
    setStatus(null);
    setErrors(failed);
    router.refresh();
  };

  return (
    <div>
      <label className={`${btn.primary} cursor-pointer ${status ? 'pointer-events-none opacity-60' : ''}`}>
        {status ?? '⬆ Chọn tệp nhạc (có thể chọn nhiều)'}
        <input
          type="file"
          multiple
          accept="audio/mpeg,audio/mp3,audio/mp4,audio/x-m4a,audio/aac,audio/ogg,.mp3,.m4a,.ogg"
          className="sr-only"
          onChange={(e) => {
            const files = Array.from(e.target.files ?? []);
            e.target.value = '';
            if (files.length) void onFiles(files);
          }}
        />
      </label>
      <p className="mt-2 text-xs text-zinc-500">MP3, M4A hoặc OGG, tối đa 20MB mỗi bài. Nên nén ~128kbps (mỗi bài ~3–4MB) để tiết kiệm băng thông.</p>
      {errors.length > 0 && (
        <ul className="mt-2 space-y-1 text-sm text-red-700" role="alert">
          {errors.map((e) => <li key={e}>{e}</li>)}
        </ul>
      )}
    </div>
  );
}

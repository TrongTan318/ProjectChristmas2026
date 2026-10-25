'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { btn } from '@/components/admin/ui';
import { MAX_VIDEO_BYTES } from '@/lib/limits';
import { fileUrl } from '@/lib/media';
import { deleteVideo } from '../actions';

interface Video {
  id: string;
  kind: 'YOUTUBE' | 'FILE';
  youtubeId: string | null;
  fileKey: string | null;
  title: string;
}

export function VideoManager({ productId, videos }: { productId: string; videos: Video[] }) {
  const router = useRouter();
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const upload = (file: File, title: string) => {
    if (file.size > MAX_VIDEO_BYTES) return setError('Video vượt quá 200MB.');
    setError(null);
    // XHR để hiển thị % tiến độ (fetch chưa hỗ trợ upload progress).
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `/api/admin/products/${productId}/videos?title=${encodeURIComponent(title)}`);
    xhr.setRequestHeader('Content-Type', 'video/mp4');
    xhr.upload.onprogress = (e) => e.lengthComputable && setProgress(Math.round((e.loaded / e.total) * 100));
    xhr.onload = () => {
      setProgress(null);
      if (xhr.status >= 300) {
        try {
          setError(JSON.parse(xhr.responseText).error);
        } catch {
          setError('Tải video thất bại.');
        }
      }
      router.refresh();
    };
    xhr.onerror = () => {
      setProgress(null);
      setError('Mất kết nối khi tải video.');
    };
    xhr.send(file);
  };

  return (
    <div>
      {videos.length === 0 && <p className="text-sm text-zinc-500">Chưa có video.</p>}
      <ul className="space-y-2">
        {videos.map((v) => (
          <li key={v.id} className="flex items-center gap-3 rounded-lg border border-zinc-200 p-2 text-sm">
            <span className="rounded bg-zinc-100 px-2 py-0.5 text-xs">{v.kind === 'YOUTUBE' ? 'YouTube' : 'MP4'}</span>
            <span className="min-w-0 flex-1 truncate">
              {v.title || '(không tiêu đề)'}{' '}
              {v.kind === 'YOUTUBE' ? (
                <a className="text-burgundy hover:underline" href={`https://youtu.be/${v.youtubeId}`} target="_blank" rel="noreferrer">
                  youtu.be/{v.youtubeId}
                </a>
              ) : (
                <a className="text-burgundy hover:underline" href={fileUrl(v.fileKey!)} target="_blank" rel="noreferrer">xem tệp</a>
              )}
            </span>
            <button
              type="button"
              className={`${btn.ghost} !text-red-600`}
              onClick={() => confirm('Xóa video này?') && startTransition(async () => { await deleteVideo(v.id); router.refresh(); })}
            >
              Xóa
            </button>
          </li>
        ))}
      </ul>

      <form
        className="mt-5 border-t border-zinc-100 pt-5"
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          const file = fd.get('file');
          if (file instanceof File && file.size > 0) upload(file, String(fd.get('title') ?? ''));
        }}
      >
        <p className="mb-3 text-sm font-medium">Tải lên video giới thiệu (MP4, tối đa 200MB)</p>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <input name="file" type="file" accept="video/mp4" required className="text-sm" />
          <input name="title" placeholder="Tiêu đề video" maxLength={200} className="rounded-lg border border-zinc-300 px-3 py-2 text-sm" />
          <button className={btn.secondary} disabled={progress !== null}>{progress !== null ? `Đang tải ${progress}%` : '⬆ Tải lên'}</button>
        </div>
        {error && <p className="mt-2 text-sm text-red-700" role="alert">{error}</p>}
      </form>
    </div>
  );
}

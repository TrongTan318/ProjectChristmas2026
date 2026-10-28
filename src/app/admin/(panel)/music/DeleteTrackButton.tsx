'use client';

import { useTransition } from 'react';
import { btn } from '@/components/admin/ui';
import { deleteMusicTrack } from './actions';

export function DeleteTrackButton({ id, title }: { id: string; title: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      className={`${btn.ghost} !text-red-600`}
      onClick={() => confirm(`Xóa bài "${title}"? Tệp nhạc sẽ bị xóa khỏi server.`) && startTransition(() => deleteMusicTrack(id))}
    >
      {pending ? 'Đang xóa…' : 'Xóa'}
    </button>
  );
}

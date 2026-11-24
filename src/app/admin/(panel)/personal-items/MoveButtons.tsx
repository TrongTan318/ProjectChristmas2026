'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { btn } from '@/components/admin/ui';
import { moveItem } from './actions';

/** Đổi thứ tự vật phẩm trên trang trưng bày. */
export function MoveButtons({ id, first, last }: { id: string; first: boolean; last: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const move = (dir: -1 | 1) =>
    start(async () => {
      await moveItem(id, dir);
      router.refresh();
    });
  return (
    <span className={`flex flex-col ${pending ? 'opacity-50' : ''}`}>
      <button type="button" className={btn.ghost} disabled={first || pending} onClick={() => move(-1)} aria-label="Lên trên">▲</button>
      <button type="button" className={btn.ghost} disabled={last || pending} onClick={() => move(1)} aria-label="Xuống dưới">▼</button>
    </span>
  );
}

'use client';

import { useEffect } from 'react';

/** Báo 1 lượt xem khi mở trang chi tiết (server tự chống đếm trùng theo IP). */
export function ViewTracker({ productId }: { productId: string }) {
  useEffect(() => {
    void fetch('/api/views', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId }),
      keepalive: true,
    }).catch(() => {});
  }, [productId]);
  return null;
}

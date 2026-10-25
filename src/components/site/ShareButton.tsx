'use client';

import { useState } from 'react';

export function ShareButton({ title, text }: { title: string; text?: string }) {
  const [copied, setCopied] = useState(false);

  const share = async () => {
    const url = window.location.href.split('#')[0]!;
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
        return;
      } catch {
        // người dùng hủy: chuyển sang sao chép
      }
    }
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      window.prompt('Sao chép liên kết:', url);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <button type="button" onClick={share} className="btn-outline-gold">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <circle cx="18" cy="5" r="3" />
        <circle cx="6" cy="12" r="3" />
        <circle cx="18" cy="19" r="3" />
        <path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4" />
      </svg>
      <span aria-live="polite">{copied ? 'Đã sao chép liên kết' : 'Chia sẻ'}</span>
    </button>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { btn } from '@/components/admin/ui';
import { LAYOUT_INFO, parseLayout, type StageLayout } from '@/domain/stage';
import { StageLayoutView } from '@/components/site/layouts/StageLayoutView';
import type { GalleryImage } from '@/components/site/PhotoLightbox';

/**
 * Nút "Xem thử": đọc tên + kiểu khung đang chọn trên form (chưa lưu) và hiện ảnh giai đoạn
 * giống trang của lớp, trên nền tối của website.
 */
export function LayoutPreview({
  layoutField,
  titleField,
  badge,
  defaultTitle,
  productName,
  images,
}: {
  /** Tên ô chọn kiểu khung trên form (vd. layout3, featuredLayout). */
  layoutField: string;
  /** Tên ô nhập tên giai đoạn trên form; bỏ trống = khung không tiêu đề (ảnh đẹp). */
  titleField?: string;
  /** Ký hiệu trong vòng tròn vàng (số giai đoạn, ♥). */
  badge: string;
  defaultTitle: string;
  productName: string;
  images: GalleryImage[];
}) {
  const [preview, setPreview] = useState<{ layout: StageLayout; title: string } | null>(null);

  useEffect(() => {
    if (!preview) return;
    const onKey = (e: KeyboardEvent) => {
      // Lightbox đang mở thì để lightbox tự xử lý Esc.
      if (e.key === 'Escape' && !document.querySelector('.yarl__container')) setPreview(null);
    };
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [preview]);

  return (
    <>
      <button
        type="button"
        className={btn.secondary}
        disabled={images.length === 0}
        title={images.length === 0 ? 'Chưa có ảnh' : 'Xem kiểu khung đang chọn, chưa cần lưu'}
        onClick={(e) => {
          const form = e.currentTarget.form;
          const data = form ? new FormData(form) : null;
          const title = (titleField ? String(data?.get(titleField) ?? '').trim() : '') || defaultTitle;
          setPreview({ layout: parseLayout(data?.get(layoutField)), title });
        }}
      >
        👁 Xem thử
      </button>

      {preview && (
        <div className="fixed inset-0 z-[100] flex flex-col bg-ink/95 [color-scheme:dark]" role="dialog" aria-modal="true" aria-label="Xem thử kiểu khung">
          <div className="flex items-center justify-between gap-3 border-b border-gold/25 px-4 py-3 text-ivory">
            <p className="min-w-0 truncate text-sm">
              Xem thử · <strong className="text-gold-light">{LAYOUT_INFO[preview.layout].name}</strong> · chưa lưu
            </p>
            <button type="button" className="btn-glass-clear !px-4 !py-2 text-sm" onClick={() => setPreview(null)} autoFocus>
              ✕ Đóng
            </button>
          </div>
          <div className="bg-museum flex-1 overflow-y-auto px-4 py-8">
            <div className="mx-auto max-w-4xl rounded-2xl border border-gold/60 bg-ink-soft/75 text-left">
              {titleField && (
                <div className="flex items-center gap-3 p-4 sm:p-5">
                  <span aria-hidden className="flex size-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-b from-gold-light to-gold font-serif text-lg font-bold text-ink">
                    {badge}
                  </span>
                  <span className="flex-1 font-serif text-xl font-semibold text-gold-light sm:text-2xl">{preview.title}</span>
                  <span className="text-sm text-ivory/60 tabular-nums">{images.length} ảnh</span>
                </div>
              )}
              <div className={titleField ? 'px-4 pb-5 sm:px-5' : 'p-4 sm:p-5'}>
                <StageLayoutView key={preview.layout} layout={preview.layout} images={images} title={`${productName} — ${preview.title}`} />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

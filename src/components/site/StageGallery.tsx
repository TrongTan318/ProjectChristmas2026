import type { StageLayout } from '@/domain/stage';
import { StageLayoutView } from './layouts/StageLayoutView';
import type { GalleryImage } from './PhotoLightbox';

export interface StageBlock {
  stage: number;
  title: string;
  note: string;
  images: GalleryImage[];
  /** Kiểu khung lớp chọn cho giai đoạn (mặc định Trình chiếu). */
  layout: StageLayout;
  /** Mở sẵn khi vào trang (giai đoạn mới nhất có ảnh). */
  open: boolean;
}

/**
 * Các khung ảnh theo giai đoạn, xếp dọc theo thứ tự truyền vào (trang đội: 3 → 2 → 1).
 * Dùng <details>: khách bấm thanh tiêu đề để mở/thu gọn, không cần JavaScript.
 */
export function StageGallery({ stages, productName }: { stages: StageBlock[]; productName: string }) {
  return (
    <div className="space-y-4 text-left">
      {stages.map((s) => (
        <details
          key={s.stage}
          open={s.open}
          className="group rounded-2xl border border-gold/35 bg-ink-soft/75 shadow-[0_18px_40px_-24px_rgb(0_0_0/0.9)] open:border-gold/60"
        >
          <summary className="flex min-h-14 cursor-pointer list-none items-center gap-3 rounded-2xl p-4 select-none sm:p-5 [&::-webkit-details-marker]:hidden">
            <span
              aria-hidden
              className="flex size-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-b from-gold-light to-gold font-serif text-lg font-bold text-ink"
            >
              {s.stage}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-serif text-xl leading-snug font-semibold text-gold-light sm:text-2xl">{s.title}</span>
              {s.note && <span className="mt-0.5 block text-sm leading-relaxed text-ivory/70">{s.note}</span>}
            </span>
            <span className="shrink-0 text-sm text-ivory/60 tabular-nums">{s.images.length > 0 ? `${s.images.length} ảnh` : 'Đang cập nhật'}</span>
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden
              className="shrink-0 text-gold transition-transform duration-300 group-open:rotate-180"
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </summary>

          <div className="px-4 pb-5 sm:px-5">
            {s.images.length > 0 ? (
              <StageLayoutView layout={s.layout} images={s.images} title={`${productName} — ${s.title}`} />
            ) : (
              <div className="flex aspect-[16/9] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-gold/35 bg-ink/40 text-ivory/55">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
                  <rect x="3" y="5" width="18" height="14" rx="2" />
                  <circle cx="9" cy="10" r="1.6" />
                  <path d="m21 16-5-5-8 8" />
                </svg>
                <span className="text-base">Ảnh giai đoạn này đang được cập nhật</span>
              </div>
            )}
          </div>
        </details>
      ))}
    </div>
  );
}

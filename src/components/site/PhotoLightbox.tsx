'use client';

import Lightbox from 'yet-another-react-lightbox';
import Zoom from 'yet-another-react-lightbox/plugins/zoom';
import Slideshow from 'yet-another-react-lightbox/plugins/slideshow';
import Thumbnails from 'yet-another-react-lightbox/plugins/thumbnails';
import Counter from 'yet-another-react-lightbox/plugins/counter';
import 'yet-another-react-lightbox/styles.css';
import 'yet-another-react-lightbox/plugins/thumbnails.css';
import 'yet-another-react-lightbox/plugins/counter.css';
import { IMAGE_SIZES, mediaUrl } from '@/lib/media';

export interface GalleryImage {
  key: string;
  width: number;
  height: number;
  alt: string;
  blurDataUrl: string;
}

/** Xem ảnh toàn màn hình (ảnh đầy đủ, không cắt), dùng chung cho mọi kiểu khung giai đoạn. */
export function PhotoLightbox({
  images,
  title,
  index,
  onClose,
  onView,
}: {
  images: GalleryImage[];
  title: string;
  /** -1 = đóng. */
  index: number;
  onClose: () => void;
  onView?: (index: number) => void;
}) {
  const slides = images.map((img) => ({
    src: mediaUrl(img.key, 1600),
    alt: img.alt || title,
    width: img.width,
    height: img.height,
    srcSet: IMAGE_SIZES.map((s) => ({
      src: mediaUrl(img.key, s),
      width: s,
      height: Math.round((img.height / img.width) * s),
    })),
  }));

  return (
    <Lightbox
      open={index >= 0}
      index={Math.max(index, 0)}
      close={onClose}
      on={onView ? { view: ({ index: i }) => onView(i) } : undefined}
      slides={slides}
      plugins={[Zoom, Slideshow, Thumbnails, Counter]}
      zoom={{ maxZoomPixelRatio: 3, scrollToZoom: true }}
      slideshow={{ delay: 4000 }}
      thumbnails={{ width: 90, height: 60, border: 1, borderColor: '#d4af37', imageFit: 'cover' }}
      counter={{ container: { style: { top: 0, bottom: 'unset' } } }}
      labels={{
        Previous: 'Ảnh trước',
        Next: 'Ảnh sau',
        Close: 'Đóng',
        Play: 'Trình chiếu',
        Pause: 'Tạm dừng',
        'Zoom in': 'Phóng to',
        'Zoom out': 'Thu nhỏ',
      }}
      styles={{ container: { backgroundColor: 'rgba(13, 10, 11, 0.96)' } }}
    />
  );
}

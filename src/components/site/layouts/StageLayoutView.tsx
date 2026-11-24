'use client';

import { useState } from 'react';
import type { StageLayout } from '@/domain/stage';
import { Gallery } from '../Gallery';
import { PhotoLightbox, type GalleryImage } from '../PhotoLightbox';
import { DiamondLayout } from './DiamondLayout';
import { FeatureLayout } from './FeatureLayout';
import { MasonryLayout } from './MasonryLayout';
import { MuseumLayout } from './MuseumLayout';
import { PolaroidLayout } from './PolaroidLayout';

const COLLAGES = {
  polaroid: PolaroidLayout,
  diamond: DiamondLayout,
  masonry: MasonryLayout,
  feature: FeatureLayout,
  museum: MuseumLayout,
} as const;

/** Hiển thị ảnh một giai đoạn theo kiểu khung lớp đã chọn; mặc định (hoặc giá trị lạ) là Trình chiếu. */
export function StageLayoutView({ layout, images, title }: { layout: StageLayout; images: GalleryImage[]; title: string }) {
  const [index, setIndex] = useState(-1);
  const Collage = layout === 'slideshow' ? null : COLLAGES[layout];
  if (!Collage) return <Gallery images={images} title={title} />;
  return (
    <>
      <Collage images={images} title={title} onOpen={setIndex} />
      <PhotoLightbox images={images} title={title} index={index} onClose={() => setIndex(-1)} />
    </>
  );
}

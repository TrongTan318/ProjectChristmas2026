import type { Metadata } from 'next';
import { SectionHeading } from '@/components/site/Decor';
import { ExhibitionFilter } from '@/components/site/ExhibitionGrid';
import { ProductCard } from '@/components/site/ProductCard';
import { requireActiveContest } from '@/server/contest';
import { listProducts } from '@/server/services/content';

export const metadata: Metadata = {
  title: 'Triển lãm',
  description: 'Tham quan triển lãm trực tuyến các hang đá Giáng Sinh 2026 của thiếu nhi Giáo xứ Bình Thới.',
};

export default async function ExhibitionPage() {
  const contest = await requireActiveContest();
  const products = await listProducts(contest.id);
  const classes = [...new Set(products.map((p) => p.team?.className).filter((c): c is string => !!c))];

  return (
    <section className="bg-museum min-h-screen pt-20 pb-24 sm:pt-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeading
          compactOnMobile
          eyebrow="Bảo tàng hang đá trực tuyến"
          title="Phòng triển lãm"
          description="Chạm vào từng tác phẩm để chiêm ngắm ảnh lớn, đọc ý tưởng, ý nghĩa và thông điệp Giáng Sinh của các em."
        />
        <div className="mt-5 sm:mt-14">
          <ExhibitionFilter
            classes={classes}
            items={products.map((p, i) => ({
              key: p.id,
              className: p.team?.className ?? '',
              node: <ProductCard product={p} large priority={i < 3} />,
            }))}
          />
        </div>
      </div>
    </section>
  );
}

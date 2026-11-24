import type { Metadata } from 'next';
import { PersonalShowcase } from '@/components/site/showcase/PersonalShowcase';
import { pickSlots } from '@/domain/personal-item';
import { mediaUrl } from '@/lib/media';
import { listPublicPersonalItems } from '@/server/services/personal-items';

export async function generateMetadata(): Promise<Metadata> {
  const items = await listPublicPersonalItems();
  const cover = items[0] ? pickSlots(items[0].images).main : null;
  return {
    title: 'Vật phẩm cá nhân',
    description: 'Trưng bày các vật phẩm cá nhân tự làm.',
    openGraph: cover ? { images: [{ url: mediaUrl(cover.key, 1600), width: cover.width, height: cover.height }] } : undefined,
  };
}

/** Trang trưng bày riêng: không bình chọn, không gắn cuộc thi hay lớp. */
export default async function PersonalItemsPage() {
  const items = await listPublicPersonalItems();

  if (items.length === 0) {
    return (
      <section className="bg-museum flex min-h-[70svh] items-center justify-center px-4 pt-28 pb-16 text-center">
        <div>
          <p className="text-xs font-bold tracking-[0.3em] text-gold uppercase">Vật phẩm cá nhân</p>
          <h1 className="mt-4 font-serif text-4xl text-gold-gradient sm:text-5xl">Sắp ra mắt</h1>
          <p className="mt-4 text-lg text-ivory/75">Các vật phẩm đang được chuẩn bị, mời bạn quay lại sau.</p>
        </div>
      </section>
    );
  }

  return (
    <>
      <h1 className="sr-only">Vật phẩm cá nhân</h1>
      <PersonalShowcase items={items} />
    </>
  );
}

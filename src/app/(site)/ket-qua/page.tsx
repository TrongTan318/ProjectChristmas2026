import type { Metadata } from 'next';
import { SectionHeading } from '@/components/site/Decor';
import { ResultsBoard } from '@/components/site/ResultsBoard';
import { getSiteSettings, requireActiveContest } from '@/server/contest';
import { getResults } from '@/server/services/results';

export const metadata: Metadata = { title: 'Kết quả bình chọn' };

export default async function ResultsPage() {
  const contest = await requireActiveContest();
  const [settings, results] = await Promise.all([getSiteSettings(contest.id), getResults(contest.id)]);

  return (
    <section className="bg-museum min-h-screen pt-32 pb-24">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <SectionHeading eyebrow="Bình chọn" title="Kết quả & Bảng xếp hạng" />
        <div className="mt-14">
          <h3 className="mb-6 text-center font-serif text-2xl text-gold-light">Top {settings.rankingTopN} hang đá được yêu thích</h3>
          <ResultsBoard initial={results} topN={settings.rankingTopN} />
        </div>
      </div>
    </section>
  );
}

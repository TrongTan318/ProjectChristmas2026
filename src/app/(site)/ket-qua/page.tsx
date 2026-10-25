import type { Metadata } from 'next';
import Link from 'next/link';
import { SectionHeading } from '@/components/site/Decor';
import { ResultsBoard } from '@/components/site/ResultsBoard';
import { getSiteSettings, requireActiveContest } from '@/server/contest';
import { getResults } from '@/server/services/results';

export const metadata: Metadata = { title: 'Kết quả bình chọn' };

export default async function ResultsPage() {
  const contest = await requireActiveContest();
  const settings = await getSiteSettings(contest.id);

  return (
    <section className="bg-museum min-h-screen pt-32 pb-24">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <SectionHeading eyebrow="Bình chọn" title="Kết quả & Bảng xếp hạng" />
        <div className="mt-14">
          {contest.resultsPublic ? (
            <>
              <h3 className="mb-6 text-center font-serif text-2xl text-gold-light">Top {settings.rankingTopN} hang đá được yêu thích</h3>
              <ResultsBoard initial={await getResults(contest.id)} realtime={contest.resultsRealtime} topN={settings.rankingTopN} />
            </>
          ) : (
            <div className="mx-auto max-w-xl rounded-2xl border border-gold/30 bg-ink-soft/80 p-10 text-center">
              <p className="font-serif text-2xl text-gold-light">Kết quả sẽ được công bố sau</p>
              <p className="mt-4 text-ivory/75">
                Ban tổ chức sẽ công bố kết quả khi kết thúc thời gian bình chọn. Trong lúc chờ, mời bạn tiếp tục tham quan triển lãm.
              </p>
              <Link href="/trien-lam" className="btn-gold mt-8">Vào triển lãm</Link>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

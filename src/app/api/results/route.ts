import { NextResponse } from 'next/server';
import { requireActiveContest } from '@/server/contest';
import { getResults } from '@/server/services/results';

/** Kết quả luôn công khai; ResultsBoard polling mỗi 10 giây. */
export async function GET() {
  const contest = await requireActiveContest();
  return NextResponse.json(await getResults(contest.id), {
    headers: { 'Cache-Control': 'public, max-age=5, s-maxage=5' },
  });
}

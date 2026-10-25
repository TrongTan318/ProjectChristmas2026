import { NextResponse } from 'next/server';
import { requireActiveContest } from '@/server/contest';
import { getResults } from '@/server/services/results';

export async function GET() {
  const contest = await requireActiveContest();
  if (!contest.resultsPublic) {
    return NextResponse.json({ error: 'RESULTS_HIDDEN' }, { status: 403, headers: { 'Cache-Control': 'no-store' } });
  }
  return NextResponse.json(await getResults(contest.id), {
    headers: { 'Cache-Control': 'public, max-age=5, s-maxage=5' },
  });
}

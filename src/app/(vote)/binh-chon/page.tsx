import type { Metadata } from 'next';
import Link from 'next/link';
import { formatSerial } from '@/domain/token';
import { getVotingState, stateToError } from '@/domain/voting';
import { isVoteErrorCode, VOTE_MESSAGES } from '@/lib/vote-messages';
import { formatDateTime } from '@/lib/format';
import { prisma } from '@/server/db';
import { requireActiveContest } from '@/server/contest';
import { listProducts } from '@/server/services/content';
import { getVoteSession } from '@/server/vote-session';
import { VoteClient } from './VoteClient';

export const metadata: Metadata = { title: 'Bình chọn', robots: { index: false } };

type Props = { searchParams: Promise<{ loi?: string; chon?: string }> };

function Notice({ code, extra }: { code: keyof typeof VOTE_MESSAGES; extra?: string }) {
  const msg = VOTE_MESSAGES[code];
  return (
    <div className="rounded-2xl border-2 border-burgundy/30 bg-white p-8 text-center shadow-md" role="alert">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-burgundy/10 text-4xl" aria-hidden>
        {code === 'TOKEN_USED' ? '✓' : '!'}
      </div>
      <h1 className="mt-4 font-serif text-3xl font-bold text-burgundy-dark">{msg.title}</h1>
      <p className="mt-4 text-xl leading-relaxed text-ink/80">{msg.body}</p>
      {extra && <p className="mt-3 text-lg text-ink/70">{extra}</p>}
      <div className="mt-8 flex flex-col gap-3">
        <Link href="/trien-lam" className="btn-glass !py-4 text-xl">Tham quan triển lãm</Link>
        <Link href="/vote" className="text-lg text-burgundy underline">Nhập mã phiếu khác</Link>
      </div>
    </div>
  );
}

export default async function VotePage({ searchParams }: Props) {
  const { loi, chon } = await searchParams;
  const contest = await requireActiveContest();

  if (isVoteErrorCode(loi)) return <Notice code={loi} />;

  const session = await getVoteSession();
  if (!session) {
    return (
      <div className="text-center">
        <h1 className="font-serif text-3xl font-bold text-burgundy-dark">Bình chọn bằng phiếu QR</h1>
        <p className="mt-4 text-xl text-ink/80">Vui lòng quét mã QR in trên phiếu bình chọn, hoặc nhập mã phiếu.</p>
        <Link href="/vote" className="btn-glass mt-8 !py-4 text-xl">Nhập mã phiếu</Link>
      </div>
    );
  }

  const token = await prisma.voteToken.findUnique({ where: { id: session.tid }, select: { status: true, usedAt: true, serial: true } });
  if (!token) return <Notice code="INVALID_TOKEN" />;
  if (token.status === 'USED') return <Notice code="TOKEN_USED" extra={`Phiếu số ${formatSerial(token.serial)} đã bình chọn lúc ${formatDateTime(token.usedAt)}.`} />;
  if (token.status === 'REVOKED') return <Notice code="TOKEN_REVOKED" />;
  const stateError = stateToError(getVotingState(contest));
  if (stateError) return <Notice code={stateError} />;

  const products = await listProducts(contest.id);

  return (
    <VoteClient
      serial={formatSerial(session.serial)}
      initialSelected={products.some((p) => p.id === chon) ? chon! : null}
      products={products.map((p) => ({
        id: p.id,
        slug: p.slug,
        name: p.name,
        className: p.team?.className ?? '',
        teamName: p.team?.name ?? '',
        coverKey: p.images[0]?.key ?? null,
        blur: p.images[0]?.blurDataUrl ?? null,
      }))}
    />
  );
}

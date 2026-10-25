import 'server-only';
import { getVotingState, stateToError, VoteError, type VoteErrorCode } from '@/domain/voting';
import { hashToken, normalizeToken } from '@/domain/token';
import { prisma } from '../db';
import { env } from '../env';
import { hit, isOver } from '../rate-limit';
import { invalidate } from '../cache';
import type { VoteSession } from '../vote-session';

// Nhiều người cùng dùng Wi-Fi nhà thờ (chung IP), nên giới hạn khá rộng;
// entropy 80 bit đã đủ chống dò mã, rate limit chủ yếu chặn spam.
const CHECK_LIMIT_PER_MIN = 60;
const FAIL_LIMIT_PER_HOUR = 50;

export type TokenCheck =
  | { ok: true; tokenId: string; contestId: string; serial: number }
  | { ok: false; code: VoteErrorCode; usedAt?: Date | null };

export async function checkToken(raw: string, ip: string): Promise<TokenCheck> {
  const failKey = `tokfail:${ip}`;
  if (isOver(failKey, FAIL_LIMIT_PER_HOUR)) return { ok: false, code: 'RATE_LIMITED' };
  if (!hit(`tok:${ip}`, CHECK_LIMIT_PER_MIN, 60_000)) return { ok: false, code: 'RATE_LIMITED' };

  const fail = (code: VoteErrorCode): TokenCheck => {
    hit(failKey, FAIL_LIMIT_PER_HOUR, 3_600_000);
    return { ok: false, code };
  };

  const token = normalizeToken(raw);
  if (!token) return fail('INVALID_TOKEN');

  const row = await prisma.voteToken.findUnique({
    where: { tokenHash: hashToken(token, env().TOKEN_SECRET) },
    include: { contest: true },
  });
  if (!row || row.deletedAt || row.contest.deletedAt) return fail('INVALID_TOKEN');
  if (row.status === 'USED') return { ok: false, code: 'TOKEN_USED', usedAt: row.usedAt };
  if (row.status === 'REVOKED') return { ok: false, code: 'TOKEN_REVOKED' };

  const stateError = stateToError(getVotingState(row.contest));
  if (stateError) return { ok: false, code: stateError };

  return { ok: true, tokenId: row.id, contestId: row.contestId, serial: row.serial };
}

export interface VoteReceipt {
  serial: number;
  productId: string;
  productName: string;
  votedAt: Date;
  replay: boolean;
}

/**
 * Ghi phiếu và khóa token trong một transaction.
 * UPDATE ... WHERE status='ACTIVE' khóa dòng token: request đồng thời thứ hai sẽ thấy 0 dòng
 * và bị từ chối. UNIQUE(token_id) trên bảng votes là lớp bảo vệ cuối.
 */
export async function castVote(
  session: VoteSession,
  productId: string,
  meta: { ipHash: string; userAgent: string },
): Promise<VoteReceipt> {
  try {
    const receipt = await prisma.$transaction(async (tx) => {
      const token = await tx.voteToken.findUnique({ where: { id: session.tid }, include: { contest: true } });
      if (!token || token.deletedAt || token.contestId !== session.cid) throw new VoteError('INVALID_TOKEN');
      if (token.status === 'REVOKED') throw new VoteError('TOKEN_REVOKED');
      if (token.status === 'USED') throw new VoteError('TOKEN_USED');

      const stateError = stateToError(getVotingState(token.contest));
      if (stateError) throw new VoteError(stateError);

      const product = await tx.product.findFirst({
        where: { id: productId, contestId: token.contestId, status: 'PUBLISHED', deletedAt: null },
        select: { id: true, name: true },
      });
      if (!product) throw new VoteError('PRODUCT_NOT_FOUND');

      const now = new Date();
      const locked = await tx.voteToken.updateMany({
        where: { id: token.id, status: 'ACTIVE', deletedAt: null },
        data: { status: 'USED', usedAt: now },
      });
      if (locked.count !== 1) throw new VoteError('TOKEN_USED');

      await tx.vote.create({
        data: {
          contestId: token.contestId,
          tokenId: token.id,
          productId: product.id,
          zoneId: token.zoneId,
          ipHash: meta.ipHash,
          userAgent: meta.userAgent,
          createdAt: now,
        },
      });
      return { serial: token.serial, productId: product.id, productName: product.name, votedAt: now, replay: false };
    });
    invalidate('r:');
    return receipt;
  } catch (error) {
    // Bấm 2 lần / mạng chập chờn gửi lại: nếu phiếu đã ghi đúng sản phẩm này thì coi như thành công.
    if (error instanceof VoteError && error.code === 'TOKEN_USED') {
      const existing = await prisma.vote.findUnique({
        where: { tokenId: session.tid },
        include: { product: { select: { name: true } }, token: { select: { serial: true } } },
      });
      if (existing && existing.productId === productId) {
        return {
          serial: existing.token.serial,
          productId,
          productName: existing.product.name,
          votedAt: existing.createdAt,
          replay: true,
        };
      }
    }
    if (isUniqueViolation(error)) throw new VoteError('TOKEN_USED');
    throw error;
  }
}

function isUniqueViolation(error: unknown): boolean {
  return typeof error === 'object' && error !== null && (error as { code?: string }).code === 'P2002';
}

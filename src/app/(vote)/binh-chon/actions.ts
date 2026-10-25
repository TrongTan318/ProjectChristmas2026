'use server';

import { z } from 'zod';
import { VoteError, type VoteErrorCode } from '@/domain/voting';
import { formatSerial } from '@/domain/token';
import { clientIp, clientUserAgent, hashIp } from '@/server/request';
import { hit } from '@/server/rate-limit';
import { castVote } from '@/server/services/voting';
import { clearVoteSession, getVoteSession } from '@/server/vote-session';

export type VoteResult =
  | { ok: true; productName: string; serial: string; votedAt: string }
  | { ok: false; code: VoteErrorCode };

const input = z.string().min(1).max(40);

export async function submitVote(productId: string): Promise<VoteResult> {
  const parsed = input.safeParse(productId);
  if (!parsed.success) return { ok: false, code: 'PRODUCT_NOT_FOUND' };

  const ip = await clientIp();
  if (!hit(`vote:${ip}`, 120, 60_000)) return { ok: false, code: 'RATE_LIMITED' };

  const session = await getVoteSession();
  if (!session) return { ok: false, code: 'SESSION_EXPIRED' };

  try {
    // Giữ cookie đến khi hết hạn: nếu phản hồi bị mất do mạng, gửi lại vẫn nhận được biên nhận.
    const receipt = await castVote(session, parsed.data, { ipHash: hashIp(ip), userAgent: await clientUserAgent() });
    return {
      ok: true,
      productName: receipt.productName,
      serial: formatSerial(receipt.serial),
      votedAt: receipt.votedAt.toISOString(),
    };
  } catch (error) {
    if (error instanceof VoteError) {
      if (error.code === 'TOKEN_REVOKED' || error.code === 'INVALID_TOKEN') {
        await clearVoteSession();
      }
      return { ok: false, code: error.code };
    }
    console.error('[vote]', error);
    throw error;
  }
}

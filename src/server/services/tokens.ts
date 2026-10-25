import 'server-only';
import { generateToken, hashToken } from '@/domain/token';
import { prisma } from '../db';
import { env } from '../env';

export const MAX_BATCH = 2000;

export interface GeneratedBallot {
  serial: number;
  token: string;
}

/**
 * Sinh một lô token. Token gốc chỉ tồn tại trong bộ nhớ để in PDF ngay,
 * DB chỉ giữ HMAC nên không thể in lại; muốn in lại phải vô hiệu lô và tạo lô mới.
 */
export async function createTokenBatch(input: {
  contestId: string;
  quantity: number;
  zoneId: string | null;
  label: string;
  userId: string;
}) {
  const secret = env().TOKEN_SECRET;
  return prisma.$transaction(
    async (tx) => {
      const max = await tx.voteToken.aggregate({ where: { contestId: input.contestId }, _max: { serial: true } });
      const serialFrom = (max._max.serial ?? 0) + 1;
      const serialTo = serialFrom + input.quantity - 1;

      const batch = await tx.tokenBatch.create({
        data: {
          contestId: input.contestId,
          zoneId: input.zoneId,
          label: input.label,
          quantity: input.quantity,
          serialFrom,
          serialTo,
          createdById: input.userId,
        },
      });

      const seen = new Set<string>();
      const ballots: GeneratedBallot[] = [];
      for (let serial = serialFrom; serial <= serialTo; serial++) {
        let token = generateToken();
        while (seen.has(token)) token = generateToken();
        seen.add(token);
        ballots.push({ serial, token });
      }

      await tx.voteToken.createMany({
        data: ballots.map((b) => ({
          contestId: input.contestId,
          batchId: batch.id,
          zoneId: input.zoneId,
          serial: b.serial,
          tokenHash: hashToken(b.token, secret),
        })),
      });

      return { batch, ballots };
    },
    { timeout: 60_000 },
  );
}

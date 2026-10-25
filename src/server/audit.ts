import 'server-only';
import type { Prisma } from '@prisma/client';
import { prisma } from './db';
import { clientIp, hashIp } from './request';

function toJson(value: unknown): Prisma.InputJsonValue | undefined {
  if (value === undefined || value === null) return undefined;
  return JSON.parse(
    JSON.stringify(value, (k, v) => (k === 'passwordHash' || k === 'tokenHash' ? undefined : v)),
  );
}

export async function audit(entry: {
  userId: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  before?: unknown;
  after?: unknown;
}) {
  await prisma.auditLog.create({
    data: {
      userId: entry.userId,
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId ?? null,
      before: toJson(entry.before),
      after: toJson(entry.after),
      ipHash: hashIp(await clientIp()),
    },
  });
}

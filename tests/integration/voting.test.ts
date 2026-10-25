/**
 * Kiểm thử tích hợp với PostgreSQL thật (chạy trong docker, xem README).
 * Dùng database riêng cho test — các bảng sẽ bị xóa dữ liệu.
 */
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

const enabled = !!process.env.DATABASE_URL && process.env.RUN_INTEGRATION === 'true';

describe.skipIf(!enabled)('Bình chọn (tích hợp DB)', async () => {
  process.env.SESSION_SECRET ??= 's'.repeat(40);
  process.env.TOKEN_SECRET ??= 't'.repeat(40);
  process.env.IP_SALT ??= 'i'.repeat(20);

  const { prisma } = await import('@/server/db');
  const { castVote, checkToken } = await import('@/server/services/voting');
  const { createTokenBatch } = await import('@/server/services/tokens');
  const { VoteError } = await import('@/domain/voting');

  let contestId = '';
  let productIds: string[] = [];
  let userId = '';
  let ipCounter = 0;
  const nextIp = () => `10.0.${Math.floor(++ipCounter / 250)}.${ipCounter % 250}`;
  const meta = { ipHash: 'test', userAgent: 'vitest' };

  async function reset() {
    await prisma.$executeRawUnsafe(
      'TRUNCATE votes, vote_tokens, token_batches, product_images, product_videos, products, teams, settings, contests, audit_logs, users, roles RESTART IDENTITY CASCADE',
    );
  }

  beforeAll(async () => {
    await reset();
    const role = await prisma.role.create({ data: { code: 'SUPER_ADMIN', name: 'Super Admin' } });
    userId = (await prisma.user.create({ data: { email: 't@t.vn', name: 'T', passwordHash: 'x', roleId: role.id } })).id;
  });

  beforeEach(async () => {
    await prisma.$executeRawUnsafe('TRUNCATE votes, vote_tokens, token_batches, products, teams, contests CASCADE');
    const contest = await prisma.contest.create({
      data: { slug: `c-${Date.now()}`, name: 'Test', organizer: 'Test', year: 2026, isActive: true, votingStatus: 'OPEN' },
    });
    contestId = contest.id;
    productIds = [];
    for (let i = 0; i < 3; i++) {
      const team = await prisma.team.create({ data: { contestId, name: `Đội ${i}`, className: `Lớp ${i}` } });
      const p = await prisma.product.create({ data: { contestId, teamId: team.id, name: `SP ${i}`, slug: `sp-${i}`, status: 'PUBLISHED' } });
      productIds.push(p.id);
    }
  });

  afterAll(async () => {
    await reset();
    await prisma.$disconnect();
  });

  async function issue(n: number) {
    const { ballots } = await createTokenBatch({ contestId, quantity: n, zoneId: null, label: 'test', userId });
    return ballots;
  }

  async function session(token: string) {
    const check = await checkToken(token, nextIp());
    if (!check.ok) throw new Error(check.code);
    return { tid: check.tokenId, cid: check.contestId, serial: check.serial };
  }

  it('bình chọn hợp lệ: ghi phiếu và khóa token vĩnh viễn', async () => {
    const [b] = await issue(1);
    const s = await session(b!.token);
    const receipt = await castVote(s, productIds[0]!, meta);
    expect(receipt.replay).toBe(false);
    expect(await prisma.vote.count()).toBe(1);
    const token = await prisma.voteToken.findUniqueOrThrow({ where: { id: s.tid } });
    expect(token.status).toBe('USED');
    expect(await checkToken(b!.token, nextIp())).toMatchObject({ ok: false, code: 'TOKEN_USED' });
  });

  it('vote trùng: gửi lại cùng sản phẩm → idempotent; khác sản phẩm → từ chối', async () => {
    const [b] = await issue(1);
    const s = await session(b!.token);
    await castVote(s, productIds[0]!, meta);
    expect((await castVote(s, productIds[0]!, meta)).replay).toBe(true);
    await expect(castVote(s, productIds[1]!, meta)).rejects.toMatchObject({ code: 'TOKEN_USED' });
    expect(await prisma.vote.count()).toBe(1);
  });

  it('token giả / sai định dạng bị từ chối, DB chỉ lưu hash', async () => {
    await issue(5);
    expect(await checkToken('AAAA-BBBB-CCCC-DDDD', nextIp())).toMatchObject({ ok: false, code: 'INVALID_TOKEN' });
    expect(await checkToken("'; DROP TABLE votes; --", nextIp())).toMatchObject({ ok: false, code: 'INVALID_TOKEN' });
    const row = await prisma.voteToken.findFirstOrThrow();
    expect(row.tokenHash).toMatch(/^[0-9a-f]{64}$/);
  });

  it('session giả mạo (token id của cuộc thi khác) bị từ chối', async () => {
    const [b] = await issue(1);
    const s = await session(b!.token);
    await expect(castVote({ ...s, cid: 'khac' }, productIds[0]!, meta)).rejects.toBeInstanceOf(VoteError);
  });

  it('token hết hạn (quá giờ đóng) và bình chọn bị khóa', async () => {
    const [b1, b2] = await issue(2);
    const s1 = await session(b1!.token);
    await prisma.contest.update({ where: { id: contestId }, data: { votingEndAt: new Date(Date.now() - 1000) } });
    expect(await checkToken(b2!.token, nextIp())).toMatchObject({ ok: false, code: 'VOTING_ENDED' });
    await expect(castVote(s1, productIds[0]!, meta)).rejects.toMatchObject({ code: 'VOTING_ENDED' });

    await prisma.contest.update({ where: { id: contestId }, data: { votingEndAt: null, votingStatus: 'LOCKED' } });
    await expect(castVote(s1, productIds[0]!, meta)).rejects.toMatchObject({ code: 'VOTING_LOCKED' });
    expect(await prisma.vote.count()).toBe(0);
  });

  it('token bị vô hiệu không bình chọn được', async () => {
    const [b] = await issue(1);
    const s = await session(b!.token);
    await prisma.voteToken.update({ where: { id: s.tid }, data: { status: 'REVOKED' } });
    await expect(castVote(s, productIds[0]!, meta)).rejects.toMatchObject({ code: 'TOKEN_REVOKED' });
  });

  it('sản phẩm nháp / không tồn tại bị từ chối', async () => {
    const [b] = await issue(1);
    const s = await session(b!.token);
    await prisma.product.update({ where: { id: productIds[2]! }, data: { status: 'DRAFT' } });
    await expect(castVote(s, productIds[2]!, meta)).rejects.toMatchObject({ code: 'PRODUCT_NOT_FOUND' });
    await expect(castVote(s, 'khong-ton-tai', meta)).rejects.toMatchObject({ code: 'PRODUCT_NOT_FOUND' });
  });

  it('race condition: 30 request đồng thời cùng 1 token → đúng 1 phiếu', async () => {
    const [b] = await issue(1);
    const s = await session(b!.token);
    const results = await Promise.allSettled(
      Array.from({ length: 30 }, (_, i) => castVote(s, productIds[i % 3]!, meta)),
    );
    const fresh = results.filter((r) => r.status === 'fulfilled' && !r.value.replay);
    expect(fresh).toHaveLength(1);
    expect(await prisma.vote.count()).toBe(1);
    for (const r of results) {
      if (r.status === 'rejected') expect(r.reason).toMatchObject({ code: 'TOKEN_USED' });
    }
  });

  it('nhiều người vote đồng thời: 200 phiếu khác nhau đều được ghi', async () => {
    const ballots = await issue(200);
    const sessions = await Promise.all(ballots.map((b) => session(b.token)));
    const results = await Promise.allSettled(sessions.map((s, i) => castVote(s, productIds[i % 3]!, meta)));
    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(200);
    expect(await prisma.vote.count()).toBe(200);
    expect(await prisma.voteToken.count({ where: { status: 'USED' } })).toBe(200);
  });

  it('seri tăng liên tục giữa các lô', async () => {
    await issue(10);
    const second = await issue(5);
    expect(second.map((b) => b.serial)).toEqual([11, 12, 13, 14, 15]);
  });
});

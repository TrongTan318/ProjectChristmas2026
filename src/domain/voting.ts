export type VotingState = 'LOCKED' | 'NOT_STARTED' | 'OPEN' | 'ENDED';

export interface VotingWindow {
  votingStatus: 'OPEN' | 'LOCKED';
  votingStartAt: Date | null;
  votingEndAt: Date | null;
}

/** Bình chọn chỉ mở khi Admin bật OPEN và thời điểm hiện tại nằm trong khung giờ. */
export function getVotingState(contest: VotingWindow, now: Date = new Date()): VotingState {
  if (contest.votingStatus === 'LOCKED') return 'LOCKED';
  if (contest.votingStartAt && now < contest.votingStartAt) return 'NOT_STARTED';
  if (contest.votingEndAt && now > contest.votingEndAt) return 'ENDED';
  return 'OPEN';
}

/** Id sản phẩm (cuid). Chỉ chữ thường + số → an toàn khi ghép vào URL. */
const PRODUCT_ID_RE = /^[a-z0-9]{20,40}$/;

/**
 * Trang đích sau khi nhập mã phiếu thủ công. Có `choice` hợp lệ (bấm "Bình chọn" ở trang một tác phẩm)
 * → `/binh-chon?chon=<id>` để chọn sẵn; còn lại → `/binh-chon`. Chỉ đánh dấu sẵn, vẫn phải bấm xác nhận.
 */
export function voteRedirectPath(choice: unknown): string {
  return typeof choice === 'string' && PRODUCT_ID_RE.test(choice) ? `/binh-chon?chon=${choice}` : '/binh-chon';
}

export type VoteErrorCode =
  | 'INVALID_TOKEN'
  | 'TOKEN_USED'
  | 'TOKEN_REVOKED'
  | 'VOTING_LOCKED'
  | 'VOTING_NOT_STARTED'
  | 'VOTING_ENDED'
  | 'PRODUCT_NOT_FOUND'
  | 'SESSION_EXPIRED'
  | 'RATE_LIMITED';

export class VoteError extends Error {
  constructor(public readonly code: VoteErrorCode) {
    super(code);
    this.name = 'VoteError';
  }
}

export function stateToError(state: VotingState): VoteErrorCode | null {
  switch (state) {
    case 'LOCKED':
      return 'VOTING_LOCKED';
    case 'NOT_STARTED':
      return 'VOTING_NOT_STARTED';
    case 'ENDED':
      return 'VOTING_ENDED';
    default:
      return null;
  }
}

export interface RankedItem {
  votes: number;
}

/**
 * "Nổi bật": các sản phẩm nhiều phiếu nhất; bằng phiếu thì nhiều lượt xem hơn
 * đứng trước, vẫn bằng thì giữ thứ tự ban đầu. Sản phẩm 0 phiếu không được chọn.
 */
export function pickFeatured<T extends RankedItem & { views: number }>(items: T[], limit = 3): T[] {
  return items
    .filter((i) => i.votes > 0)
    .sort((a, b) => b.votes - a.votes || b.views - a.views)
    .slice(0, limit);
}

/** Xếp hạng kiểu thi đấu: đồng phiếu đồng hạng (1, 1, 3...). */
export function rank<T extends RankedItem>(items: T[]): (T & { rank: number; percent: number })[] {
  const total = items.reduce((s, i) => s + i.votes, 0);
  const sorted = [...items].sort((a, b) => b.votes - a.votes);
  let lastVotes = -1;
  let lastRank = 0;
  return sorted.map((item, index) => {
    if (item.votes !== lastVotes) {
      lastRank = index + 1;
      lastVotes = item.votes;
    }
    return { ...item, rank: lastRank, percent: total ? (item.votes / total) * 100 : 0 };
  });
}

import type { VoteErrorCode } from '@/domain/voting';

export const VOTE_MESSAGES: Record<VoteErrorCode, { title: string; body: string }> = {
  INVALID_TOKEN: {
    title: 'Mã phiếu không hợp lệ',
    body: 'Vui lòng kiểm tra lại mã in trên phiếu, hoặc quét lại mã QR.',
  },
  TOKEN_USED: {
    title: 'Phiếu này đã được sử dụng',
    body: 'Mỗi phiếu chỉ bình chọn được một lần. Cảm ơn bạn đã tham gia!',
  },
  TOKEN_REVOKED: {
    title: 'Phiếu đã bị vô hiệu hóa',
    body: 'Phiếu này không còn giá trị. Vui lòng liên hệ Ban tổ chức để được hỗ trợ.',
  },
  VOTING_LOCKED: {
    title: 'Bình chọn đang tạm khóa',
    body: 'Ban tổ chức đang tạm dừng bình chọn. Vui lòng quay lại sau.',
  },
  VOTING_NOT_STARTED: {
    title: 'Bình chọn chưa bắt đầu',
    body: 'Hãy giữ phiếu cẩn thận và quay lại khi bình chọn mở. Trong lúc chờ, mời bạn tham quan triển lãm.',
  },
  VOTING_ENDED: {
    title: 'Bình chọn đã kết thúc',
    body: 'Cảm ơn bạn đã quan tâm. Mời bạn xem kết quả trên trang Kết quả.',
  },
  PRODUCT_NOT_FOUND: {
    title: 'Không tìm thấy sản phẩm',
    body: 'Sản phẩm bạn chọn không còn trong danh sách. Vui lòng chọn lại.',
  },
  SESSION_EXPIRED: {
    title: 'Phiên bình chọn đã hết hạn',
    body: 'Vui lòng quét lại mã QR trên phiếu để tiếp tục.',
  },
  RATE_LIMITED: {
    title: 'Thao tác quá nhanh',
    body: 'Bạn đã thử quá nhiều lần. Vui lòng đợi vài phút rồi thử lại.',
  },
};

export function isVoteErrorCode(value: string | undefined | null): value is VoteErrorCode {
  return !!value && value in VOTE_MESSAGES;
}

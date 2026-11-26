'use server';

import { redirect } from 'next/navigation';
import { clientIp } from '@/server/request';
import { checkToken } from '@/server/services/voting';
import { setVoteSession } from '@/server/vote-session';
import { VOTE_MESSAGES } from '@/lib/vote-messages';
import { voteRedirectPath } from '@/domain/voting';

export type ManualCodeState = { error: string; code: string } | null;

export async function submitManualCode(_prev: ManualCodeState, form: FormData): Promise<ManualCodeState> {
  const code = String(form.get('code') ?? '').slice(0, 64);
  const result = await checkToken(code, await clientIp());
  if (!result.ok) {
    const msg = VOTE_MESSAGES[result.code];
    // Trả lại đúng chuỗi người dùng vừa gõ (≤ 8 ký tự như ô nhập) để ô không bị xóa trắng — không lưu ở đâu.
    return { error: `${msg.title}. ${msg.body}`, code: code.slice(0, 8) };
  }
  await setVoteSession({ tid: result.tokenId, cid: result.contestId, serial: result.serial });
  // Nhập từ popup ở trang tác phẩm → chọn sẵn tác phẩm đó (vẫn phải bấm xác nhận ở /binh-chon).
  redirect(voteRedirectPath(form.get('chon')));
}

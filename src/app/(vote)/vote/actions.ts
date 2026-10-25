'use server';

import { redirect } from 'next/navigation';
import { clientIp } from '@/server/request';
import { checkToken } from '@/server/services/voting';
import { setVoteSession } from '@/server/vote-session';
import { VOTE_MESSAGES } from '@/lib/vote-messages';

export async function submitManualCode(_prev: { error: string } | null, form: FormData) {
  const code = String(form.get('code') ?? '').slice(0, 64);
  const result = await checkToken(code, await clientIp());
  if (!result.ok) {
    const msg = VOTE_MESSAGES[result.code];
    return { error: `${msg.title}. ${msg.body}` };
  }
  await setVoteSession({ tid: result.tokenId, cid: result.contestId, serial: result.serial });
  redirect('/binh-chon');
}

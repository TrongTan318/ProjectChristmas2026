import { NextResponse, type NextRequest } from 'next/server';
import { checkToken } from '@/server/services/voting';
import { createVoteSessionCookie } from '@/server/vote-session';

/** Chuyển hướng tương đối: sau proxy, request.url có thể là localhost thay vì tên miền thật. */
function redirectTo(location: string) {
  return new NextResponse(null, {
    status: 303,
    headers: { Location: location, 'Referrer-Policy': 'no-referrer', 'Cache-Control': 'no-store' },
  });
}

/**
 * Đích của mã QR: /v/<token>. Xác thực token, đặt cookie phiên bình chọn ngắn hạn
 * rồi chuyển hướng ngay để token không nằm lại trên thanh địa chỉ / lịch sử.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const ip =
    request.headers.get('x-real-ip') ?? request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  const result = await checkToken(decodeURIComponent(token).slice(0, 64), ip);

  if (!result.ok) return redirectTo(`/binh-chon?loi=${result.code}`);

  const cookie = await createVoteSessionCookie({ tid: result.tokenId, cid: result.contestId, serial: result.serial });
  const res = redirectTo('/binh-chon');
  res.cookies.set(cookie.name, cookie.value, cookie.options);
  return res;
}

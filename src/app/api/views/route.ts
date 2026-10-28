import { NextResponse } from 'next/server';
import { clientIp, clientUserAgent, isSameOrigin } from '@/server/request';
import { recordView } from '@/server/services/content';

/**
 * Trình duyệt báo lượt xem trang chi tiết. Không đếm lúc render trang vì HTML
 * công khai được Nginx microcache — phần lớn lượt xem sẽ không tới app.
 */
export async function POST(request: Request) {
  if (!isSameOrigin(request)) return new NextResponse(null, { status: 403 });
  const body = (await request.json().catch(() => null)) as { productId?: unknown } | null;
  const productId = body?.productId;
  if (typeof productId !== 'string' || !/^[a-z0-9]{10,40}$/.test(productId)) {
    return new NextResponse(null, { status: 400 });
  }
  await recordView(productId, await clientIp(), await clientUserAgent());
  return new NextResponse(null, { status: 204, headers: { 'Cache-Control': 'no-store' } });
}

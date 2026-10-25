import { NextResponse, type NextRequest } from 'next/server';

/** Lớp chặn sớm: chưa có cookie phiên thì về trang đăng nhập. Xác thực đầy đủ nằm ở server (requireAdmin). */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname.startsWith('/admin') && pathname !== '/admin/login' && !request.cookies.has('admin_session')) {
    return new NextResponse(null, { status: 307, headers: { Location: '/admin/login' } });
  }
  const res = NextResponse.next();
  res.headers.set('Cache-Control', 'no-store');
  res.headers.set('X-Robots-Tag', 'noindex, nofollow');
  return res;
}

export const config = {
  matcher: ['/admin/:path*'],
};

import { NextResponse, type NextRequest } from 'next/server';

/** Lớp chặn sớm: chưa có cookie phiên thì về trang đăng nhập. Xác thực đầy đủ nằm ở server (requireAdmin). */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname.startsWith('/admin') && pathname !== '/admin/login' && !request.cookies.has('admin_session')) {
    // Middleware của Next bắt buộc URL tuyệt đối khi chuyển hướng (đường dẫn tương đối → lỗi 500).
    const login = request.nextUrl.clone();
    login.pathname = '/admin/login';
    login.search = '';
    return NextResponse.redirect(login, 307);
  }
  const res = NextResponse.next();
  res.headers.set('Cache-Control', 'no-store');
  res.headers.set('X-Robots-Tag', 'noindex, nofollow');
  return res;
}

export const config = {
  matcher: ['/admin/:path*'],
};

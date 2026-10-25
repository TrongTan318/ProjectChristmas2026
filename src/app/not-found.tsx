import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="bg-museum flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <p className="font-serif text-7xl text-gold-gradient">404</p>
      <h1 className="mt-4 font-serif text-2xl text-ivory">Không tìm thấy trang</h1>
      <p className="mt-3 max-w-md text-ivory/70">Trang bạn tìm có thể đã được di chuyển hoặc không còn tồn tại.</p>
      <Link href="/" className="btn-gold mt-8">Về trang chủ</Link>
    </main>
  );
}

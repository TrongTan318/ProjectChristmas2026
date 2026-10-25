import { NextResponse, type NextRequest } from 'next/server';
import { getCurrentAdmin } from '@/server/auth';
import { ImageError, MAX_IMAGE_BYTES, processImage } from '@/server/images';
import { isSameOrigin } from '@/server/request';

/** Upload ảnh cho banner / tin tức / logo nhà tài trợ. Trả về khóa lưu trữ để gắn vào form. */
export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: 'Yêu cầu không hợp lệ.' }, { status: 403 });
  if (!(await getCurrentAdmin())) return NextResponse.json({ error: 'Phiên đăng nhập đã hết hạn.' }, { status: 401 });

  const form = await request.formData().catch(() => null);
  const file = form?.get('file');
  if (!(file instanceof File)) return NextResponse.json({ error: 'Không có tệp ảnh.' }, { status: 400 });
  if (file.size > MAX_IMAGE_BYTES) return NextResponse.json({ error: 'Ảnh vượt quá 15MB.' }, { status: 413 });

  try {
    const image = await processImage(Buffer.from(await file.arrayBuffer()), 'content');
    return NextResponse.json({ key: image.key });
  } catch (error) {
    if (error instanceof ImageError) return NextResponse.json({ error: error.message }, { status: 400 });
    console.error('[upload]', error);
    return NextResponse.json({ error: 'Không xử lý được ảnh.' }, { status: 500 });
  }
}

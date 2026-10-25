import 'server-only';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { isRedirectError } from 'next/dist/client/components/redirect-error';
import { failure, success, type ActionState } from '@/lib/action';
import { ForbiddenError } from './auth';
import { ImageError } from './images';

/** Bọc server action: chuyển lỗi thành thông báo thân thiện, không lộ chi tiết nội bộ. */
export async function runAction(fn: () => Promise<string | void>): Promise<ActionState> {
  try {
    const message = await fn();
    return success(message || 'Đã lưu.');
  } catch (error) {
    if (isRedirectError(error)) throw error;
    if (error instanceof ZodError) {
      return failure(error.issues.map((i) => i.message).join(' · '));
    }
    if (error instanceof ForbiddenError || error instanceof ImageError || error instanceof UserError) {
      return failure(error.message);
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return failure('Dữ liệu bị trùng (tên hoặc mã đã tồn tại).');
    }
    console.error('[action]', error);
    return failure('Đã có lỗi xảy ra. Vui lòng thử lại.');
  }
}

/** Lỗi nghiệp vụ có thể hiển thị trực tiếp cho người dùng. */
export class UserError extends Error {}

export function str(form: FormData, name: string): string {
  const v = form.get(name);
  return typeof v === 'string' ? v.trim() : '';
}

export function bool(form: FormData, name: string): boolean {
  const v = form.get(name);
  return v === 'on' || v === 'true' || v === '1';
}

export function int(form: FormData, name: string, fallback = 0): number {
  const n = Number.parseInt(str(form, name), 10);
  return Number.isFinite(n) ? n : fallback;
}

'use client';

import { useActionState, useEffect, useRef } from 'react';
import { useFormStatus } from 'react-dom';
import type { ActionState } from '@/lib/action';
import { cn } from '@/lib/format';
import { btn } from './ui';

type Action = (prev: ActionState, form: FormData) => Promise<ActionState>;

/** Form gọi server action, hiển thị thông báo thành công / lỗi ngay bên dưới. */
export function ActionForm({
  action,
  children,
  className,
  resetOnSuccess,
  confirmMessage,
}: {
  action: Action;
  children: React.ReactNode;
  className?: string;
  resetOnSuccess?: boolean;
  confirmMessage?: string;
}) {
  const [state, formAction] = useActionState(action, null);
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok && resetOnSuccess) ref.current?.reset();
  }, [state, resetOnSuccess]);

  return (
    <form
      ref={ref}
      action={formAction}
      className={className}
      onSubmit={(e) => {
        if (confirmMessage && !window.confirm(confirmMessage)) e.preventDefault();
      }}
    >
      {children}
      {state && (
        <p
          role={state.ok ? 'status' : 'alert'}
          className={cn(
            'mt-3 rounded-lg px-3 py-2 text-sm',
            state.ok ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800',
          )}
        >
          {state.message}
        </p>
      )}
    </form>
  );
}

export function SubmitButton({
  children,
  variant = 'primary',
  className,
}: {
  children: React.ReactNode;
  variant?: keyof typeof btn;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={cn(btn[variant], className)}>
      {pending ? 'Đang xử lý…' : children}
    </button>
  );
}

'use client';

import { useActionState, useEffect, useRef } from 'react';
import { submitManualCode } from './actions';

/** `choiceId`: có khi mở từ popup ở trang một tác phẩm → nhập mã xong chọn sẵn tác phẩm đó. */
export function ManualCodeForm({ choiceId, autoFocus }: { choiceId?: string; autoFocus?: boolean } = {}) {
  const [state, action, pending] = useActionState(submitManualCode, null);
  const inputId = choiceId ? `code-${choiceId}` : 'code';
  const inputRef = useRef<HTMLInputElement>(null);

  // Nhập sai: giữ lại mã vừa gõ (defaultValue = mã server trả về) và đặt con trỏ cuối ô để sửa ngay.
  useEffect(() => {
    const el = inputRef.current;
    if (!state?.error || !el) return;
    el.focus();
    el.setSelectionRange(el.value.length, el.value.length);
  }, [state]);
  return (
    <form action={action} className="mt-5">
      {choiceId && <input type="hidden" name="chon" value={choiceId} />}
      <label htmlFor={inputId} className="sr-only">Mã phiếu</label>
      <input
        ref={inputRef}
        id={inputId}
        autoFocus={autoFocus}
        defaultValue={state?.code ?? ''}
        name="code"
        required
        autoComplete="off"
        autoCapitalize="characters"
        autoCorrect="off"
        spellCheck={false}
        inputMode="text"
        enterKeyHint="go"
        maxLength={8}
        placeholder="XXXXX"
        className="w-full rounded-xl border-2 border-ink/30 bg-ivory px-4 py-4 text-center font-mono text-2xl tracking-widest uppercase focus:border-burgundy focus:outline-none"
        aria-describedby={state?.error ? `${inputId}-error` : undefined}
      />
      {state?.error && (
        <p id={`${inputId}-error`} role="alert" className="mt-3 rounded-lg bg-red-50 p-3 text-lg text-red-800">
          {state.error}
        </p>
      )}
      <button type="submit" disabled={pending} className="btn-glass mt-5 w-full !py-4 text-xl">
        {pending ? 'Đang kiểm tra…' : 'Tiếp tục'}
      </button>
    </form>
  );
}

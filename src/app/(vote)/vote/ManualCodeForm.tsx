'use client';

import { useActionState } from 'react';
import { submitManualCode } from './actions';

export function ManualCodeForm() {
  const [state, action, pending] = useActionState(submitManualCode, null);
  return (
    <form action={action} className="mt-5">
      <label htmlFor="code" className="sr-only">Mã phiếu</label>
      <input
        id="code"
        name="code"
        required
        autoComplete="off"
        autoCapitalize="characters"
        spellCheck={false}
        inputMode="text"
        maxLength={24}
        placeholder="XXXX-XXXX-XXXX-XXXX"
        className="w-full rounded-xl border-2 border-ink/30 bg-ivory px-4 py-4 text-center font-mono text-2xl tracking-widest uppercase focus:border-burgundy focus:outline-none"
        aria-describedby={state?.error ? 'code-error' : undefined}
      />
      {state?.error && (
        <p id="code-error" role="alert" className="mt-3 rounded-lg bg-red-50 p-3 text-lg text-red-800">
          {state.error}
        </p>
      )}
      <button type="submit" disabled={pending} className="btn-gold mt-5 w-full !py-4 text-xl">
        {pending ? 'Đang kiểm tra…' : 'Tiếp tục'}
      </button>
    </form>
  );
}

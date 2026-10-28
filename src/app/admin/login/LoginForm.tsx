'use client';

import { useActionState } from 'react';
import { login } from './actions';

export function LoginForm() {
  const [state, action, pending] = useActionState(login, null);
  return (
    <form action={action} className="mt-8 space-y-4">
      <label className="block">
        <span className="mb-1 block text-sm text-ivory/80">Email</span>
        <input
          name="email"
          type="email"
          required
          autoComplete="username"
          className="w-full rounded-lg border border-gold/30 bg-ink px-3 py-2.5 text-ivory focus:border-gold focus:outline-none"
        />
      </label>
      <label className="block">
        <span className="mb-1 block text-sm text-ivory/80">Mật khẩu</span>
        <input
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="w-full rounded-lg border border-gold/30 bg-ink px-3 py-2.5 text-ivory focus:border-gold focus:outline-none"
        />
      </label>
      {state?.error && (
        <p role="alert" className="rounded-lg bg-red-950/60 px-3 py-2 text-sm text-red-200">
          {state.error}
        </p>
      )}
      <button type="submit" disabled={pending} className="btn-glass w-full">
        {pending ? 'Đang đăng nhập…' : 'Đăng nhập'}
      </button>
    </form>
  );
}

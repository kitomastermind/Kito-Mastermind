'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { loginAction } from '@/server/actions/auth';

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [notice, setNotice] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setNotice('Signing you in…');
    const result = await loginAction({ email, password, remember });
    if (!result.ok) {
      setNotice(result.error);
      setSubmitting(false);
      return;
    }
    router.push(result.data.redirectTo);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <label className="block">
        <span className="mb-1 block font-sans text-[11px] font-semibold tracking-[0.05em] text-primary uppercase">
          Email
        </span>
        <input
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="h-11 w-full rounded-[4px] border border-line bg-cream-flat px-3 text-ink focus-visible:border-secondary"
        />
      </label>
      <label className="block">
        <span className="mb-1 block font-sans text-[11px] font-semibold tracking-[0.05em] text-primary uppercase">
          Password
        </span>
        <input
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="h-11 w-full rounded-[4px] border border-line bg-cream-flat px-3 text-ink focus-visible:border-secondary"
        />
      </label>
      <div className="flex items-center justify-between gap-3 text-sm">
        <label className="flex items-center gap-2 text-ink">
          <input
            type="checkbox"
            checked={remember}
            onChange={(event) => setRemember(event.target.checked)}
            className="size-4 rounded-[4px] border-line"
          />
          Keep me signed in
        </label>
        <a href="/forgot-password" className="text-primary-soft">
          Forgot password?
        </a>
      </div>
      <button
        type="submit"
        disabled={submitting}
        className="h-11 w-full rounded-[4px] bg-secondary text-sm font-semibold text-primary-deep hover:bg-secondary-deep disabled:opacity-70"
      >
        {submitting ? 'Signing in…' : 'Sign in'}
      </button>
      <p className="min-h-4 text-sm text-muted" aria-live="polite">
        {notice}
      </p>
    </form>
  );
}

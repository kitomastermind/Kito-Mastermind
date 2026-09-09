'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eyebrow } from '@/components/kito/Eyebrow';
import { resetPasswordAction } from '@/server/actions/auth';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [notice, setNotice] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    const result = await resetPasswordAction({ password, confirm });
    setSubmitting(false);
    if (!result.ok) {
      setNotice(result.error);
      return;
    }
    router.push('/login');
  }

  return (
    <div className="text-center">
      <Eyebrow tone="onDark">CHAPTER NETWORK · MEMBERS ONLY</Eyebrow>
      <div
        className="shadow-login mt-8 rounded-[6px] border border-line bg-cream p-6 text-left text-ink"
      >
        <h1 className="font-display text-2xl font-[450] text-primary">Choose a new password</h1>
        <form onSubmit={onSubmit} className="mt-5 space-y-4">
          <label className="block">
            <span className="mb-1 block text-[11px] font-semibold tracking-[0.05em] text-primary uppercase">
              New password
            </span>
            <input
              type="password"
              required
              minLength={12}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="h-11 w-full rounded-[4px] border border-line bg-cream-flat px-3"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-[11px] font-semibold tracking-[0.05em] text-primary uppercase">
              Confirm password
            </span>
            <input
              type="password"
              required
              minLength={12}
              value={confirm}
              onChange={(event) => setConfirm(event.target.value)}
              className="h-11 w-full rounded-[4px] border border-line bg-cream-flat px-3"
            />
          </label>
          <button
            type="submit"
            disabled={submitting}
            className="h-11 w-full rounded-[4px] bg-secondary font-semibold text-primary-deep"
          >
            {submitting ? 'Saving…' : 'Save password'}
          </button>
          <p className="min-h-4 text-sm text-muted" aria-live="polite">
            {notice}
          </p>
        </form>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { Eyebrow } from '@/components/kito/Eyebrow';
import { forgotPasswordAction } from '@/server/actions/auth';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [notice, setNotice] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    const result = await forgotPasswordAction({ email });
    setSubmitting(false);
    setNotice(
      result.ok
        ? 'If that email is on file, we sent reset instructions.'
        : result.error,
    );
  }

  return (
    <div className="text-center">
      <Eyebrow>CHAPTER NETWORK · MEMBERS ONLY</Eyebrow>
      <div
        className="mt-8 rounded-[6px] border border-line bg-cream p-6 text-left text-ink"
        style={{ boxShadow: 'var(--shadow-login)' }}
      >
        <h1 className="font-display text-2xl font-[450] text-primary">Reset your password</h1>
        <p className="mt-1 mb-5 text-sm text-muted">
          Enter the email on your invitation. We will send a reset link if the account exists.
        </p>
        <form onSubmit={onSubmit} className="space-y-4">
          <label className="block">
            <span className="mb-1 block text-[11px] font-semibold tracking-[0.05em] text-primary uppercase">
              Email
            </span>
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="h-11 w-full rounded-[4px] border border-line bg-cream-flat px-3"
            />
          </label>
          <button
            type="submit"
            disabled={submitting}
            className="h-11 w-full rounded-[4px] bg-secondary font-semibold text-primary-deep"
          >
            {submitting ? 'Sending…' : 'Send reset link'}
          </button>
          <p className="min-h-4 text-sm text-muted" aria-live="polite">
            {notice}
          </p>
        </form>
        <a href="/login" className="mt-2 inline-block text-sm text-primary-soft">
          Back to sign in
        </a>
      </div>
    </div>
  );
}

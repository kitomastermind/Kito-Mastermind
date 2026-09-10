'use client';

import { useState } from 'react';
import { BrandMark } from '@/components/brand/BrandMark';
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
    <div className="mx-auto w-full max-w-[420px]">
      <div className="mb-6 text-center">
        <BrandMark className="mx-auto h-12 w-12" />
        <div className="mt-4">
          <Eyebrow tone="onDark">Chapter circle · members only</Eyebrow>
        </div>
      </div>
      <div className="shadow-login rounded-2xl bg-white p-6 text-left text-[#0E1F1A]">
        <h1 className="text-lg font-bold text-[#0E1F1A]">Reset your password</h1>
        <p className="mt-1 mb-5 text-sm text-[#5A6B7D]">
          Enter the email on your invitation. We will send a reset link if the account exists.
        </p>
        <form onSubmit={onSubmit} className="space-y-4">
          <label className="block">
            <span className="field-label">Email</span>
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="input-glass"
            />
          </label>
          <button type="submit" disabled={submitting} className="btn-primary w-full">
            {submitting ? 'Sending…' : 'Send reset link'}
          </button>
          <p className="min-h-4 text-sm text-[#5A6B7D]" aria-live="polite">
            {notice}
          </p>
        </form>
        <a href="/login" className="mt-2 inline-block text-sm font-semibold text-[#0E1F1A]">
          Back to sign in
        </a>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { BrandMark } from '@/components/brand/BrandMark';
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
    <div className="mx-auto w-full max-w-[420px]">
      <div className="mb-6 text-center">
        <BrandMark className="mx-auto h-12 w-12" />
        <div className="mt-4">
          <Eyebrow tone="onDark">Chapter circle · members only</Eyebrow>
        </div>
      </div>
      <div className="shadow-login rounded-2xl bg-white p-6 text-left text-[#204559]">
        <h1 className="text-lg font-bold text-[#204559]">Choose a new password</h1>
        <form onSubmit={onSubmit} className="mt-5 space-y-4">
          <label className="block">
            <span className="field-label">New password</span>
            <input
              type="password"
              required
              minLength={12}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="input-glass"
            />
          </label>
          <label className="block">
            <span className="field-label">Confirm password</span>
            <input
              type="password"
              required
              minLength={12}
              value={confirm}
              onChange={(event) => setConfirm(event.target.value)}
              className="input-glass"
            />
          </label>
          <button type="submit" disabled={submitting} className="btn-primary w-full">
            {submitting ? 'Saving…' : 'Save password'}
          </button>
          <p className="min-h-4 text-sm text-red-700" aria-live="polite">
            {notice}
          </p>
        </form>
      </div>
    </div>
  );
}

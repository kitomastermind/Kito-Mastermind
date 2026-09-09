'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { acceptInvitationAction } from '@/server/actions/invite';

export function InviteForm({
  token,
  email,
  chapterName,
  role,
}: {
  token: string;
  email: string;
  chapterName: string;
  role: string;
}) {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [phone, setPhone] = useState('');
  const [brokerage, setBrokerage] = useState('');
  const [accepted, setAccepted] = useState(false);
  const [notice, setNotice] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const strength = useMemo(() => {
    if (password.length >= 16) return 'Strong';
    if (password.length >= 12) return 'Good';
    if (password.length > 0) return 'Too short';
    return '';
  }, [password]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    const result = await acceptInvitationAction({
      token,
      fullName,
      password,
      confirm,
      phone,
      brokerage,
      accepted: accepted ? true : undefined,
    });
    setSubmitting(false);
    if (!result.ok) {
      setNotice(result.error);
      return;
    }
    router.push(result.data.redirectTo);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <p className="text-sm text-muted">
        {email} · {chapterName} Chapter · {role.replace('_', ' ')}
      </p>
      <label className="block">
        <span className="mb-1 block text-[11px] font-semibold tracking-[0.05em] text-primary uppercase">
          Full name
        </span>
        <input
          required
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
          className="h-11 w-full rounded-[4px] border border-line bg-cream-flat px-3"
        />
      </label>
      <label className="block">
        <span className="mb-1 block text-[11px] font-semibold tracking-[0.05em] text-primary uppercase">
          Password
        </span>
        <input
          type="password"
          required
          minLength={12}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="h-11 w-full rounded-[4px] border border-line bg-cream-flat px-3"
        />
        <span className="text-xs text-muted">{strength}</span>
      </label>
      <label className="block">
        <span className="mb-1 block text-[11px] font-semibold tracking-[0.05em] text-primary uppercase">
          Confirm password
        </span>
        <input
          type="password"
          required
          value={confirm}
          onChange={(event) => setConfirm(event.target.value)}
          className="h-11 w-full rounded-[4px] border border-line bg-cream-flat px-3"
        />
      </label>
      <label className="block">
        <span className="mb-1 block text-[11px] font-semibold tracking-[0.05em] text-primary uppercase">
          Phone
        </span>
        <input
          type="tel"
          required
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          className="h-11 w-full rounded-[4px] border border-line bg-cream-flat px-3"
        />
      </label>
      <label className="block">
        <span className="mb-1 block text-[11px] font-semibold tracking-[0.05em] text-primary uppercase">
          Brokerage
        </span>
        <input
          required
          value={brokerage}
          onChange={(event) => setBrokerage(event.target.value)}
          className="h-11 w-full rounded-[4px] border border-line bg-cream-flat px-3"
        />
      </label>
      <label className="flex items-start gap-2 text-sm text-ink">
        <input
          type="checkbox"
          checked={accepted}
          onChange={(event) => setAccepted(event.target.checked)}
          className="mt-1 size-4"
          required
        />
        <span>
          I have read and accept the{' '}
          <a href="/agreement" className="text-primary-soft underline">
            KITO Mastermind member agreement
          </a>
          .
        </span>
      </label>
      <button
        type="submit"
        disabled={submitting}
        className="h-11 w-full rounded-[4px] bg-secondary font-semibold text-primary-deep"
      >
        {submitting ? 'Creating your account…' : 'Accept invitation'}
      </button>
      <p className="min-h-4 text-sm text-muted" aria-live="polite">
        {notice}
      </p>
    </form>
  );
}

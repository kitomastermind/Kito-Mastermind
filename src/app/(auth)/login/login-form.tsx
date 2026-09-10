'use client';

import { useState, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';
import { loginAction } from '@/server/actions/auth';

const emptySubscribe = () => () => undefined;

export function LoginForm() {
  const router = useRouter();
  const hydrated = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
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
    <form
      onSubmit={onSubmit}
      data-hydrated={hydrated ? 'ready' : 'pending'}
      className="space-y-4"
    >
      <label className="block" htmlFor="login-email">
        <span className="field-label">Email</span>
        <input
          id="login-email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="input-glass"
        />
      </label>
      <label className="block" htmlFor="login-password">
        <span className="field-label">Password</span>
        <div className="relative">
          <input
            id="login-password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="input-glass pr-12"
          />
          <button
            type="button"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            className="absolute top-1/2 right-2 -translate-y-1/2 touch-target text-[#5A6B7D]"
            onClick={() => setShowPassword((value) => !value)}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </label>
      <div className="flex items-center justify-between gap-3 text-sm">
        <label className="flex items-center gap-2 text-[#0E1F1A]">
          <input
            type="checkbox"
            checked={remember}
            onChange={(event) => setRemember(event.target.checked)}
            className="size-4 rounded-[4px] border-[#0E1F1A]/20"
          />
          Keep me signed in
        </label>
        <a href="/forgot-password" className="font-semibold text-[#0E1F1A]">
          Forgot password?
        </a>
      </div>
      <button type="submit" disabled={!hydrated || submitting} className="btn-primary w-full">
        {submitting ? 'Signing in…' : 'Sign in'}
      </button>
      <p
        className={`min-h-4 text-sm ${notice.startsWith('Signing') ? 'text-[#5A6B7D]' : 'text-red-700'}`}
        aria-live="polite"
      >
        {notice}
      </p>
    </form>
  );
}

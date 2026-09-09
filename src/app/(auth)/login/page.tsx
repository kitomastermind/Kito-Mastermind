import { Eyebrow } from '@/components/kito/Eyebrow';
import { Wordmark } from '@/components/kito/Wordmark';
import { LoginForm } from '@/app/(auth)/login/login-form';

export default function LoginPage() {
  const year = new Date().getFullYear();
  return (
    <div className="flex flex-col items-center text-center">
      <Eyebrow>CHAPTER NETWORK · MEMBERS ONLY</Eyebrow>
      <div className="mt-6">
        <Wordmark />
      </div>
      <p className="mt-3 text-sm text-muted">
        The private accountability and production network for Kito mastermind chapters.
      </p>
      <div
        className="mt-8 w-full rounded-[6px] border border-line bg-cream p-6 text-left text-ink"
        style={{ boxShadow: 'var(--shadow-login)' }}
      >
        <h1 className="font-display text-2xl font-[450] text-primary">
          Sign in to your chapter
        </h1>
        <p className="mt-1 mb-5 text-sm text-muted">
          Enter your member credentials to continue.
        </p>
        <LoginForm />
        <div className="mt-2 border-t border-line pt-4 text-sm text-muted">
          New to your chapter?{' '}
          <strong className="text-ink">Request an invitation</strong> from your
          accountability partner.
        </div>
      </div>
      <p className="mt-8 font-mono text-[10.5px] tracking-[0.12em] text-muted uppercase">
        MEMBERSHIP IS BY INVITATION ONLY · KITO MASTERMIND © {year}
      </p>
    </div>
  );
}

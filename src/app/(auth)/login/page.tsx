import { BrandMark } from '@/components/brand/BrandMark';
import { Eyebrow } from '@/components/kito/Eyebrow';
import { LoginForm } from '@/app/(auth)/login/login-form';
import { BRAND } from '@/lib/brand';

export default function LoginPage() {
  const year = new Date().getFullYear();
  return (
    <div className="grid w-full items-center gap-10 lg:grid-cols-[1fr_minmax(0,420px)]">
      <div className="hidden lg:block">
        <div className="flex items-center gap-3">
          <BrandMark className="h-12 w-12" />
          <p className="font-marketing text-3xl font-bold tracking-[-0.03em] text-[#F3FAF5]">
            {BRAND.product}
          </p>
        </div>
        <Eyebrow tone="onDark">Chapter circle · members only</Eyebrow>
        <h1 className="mt-6 max-w-[11ch] font-marketing text-5xl leading-[0.98] font-bold text-[#F3FAF5]">
          Keep the circle accountable.
        </h1>
        <p className="mt-4 max-w-[38ch] text-[17px] text-[rgba(243,250,245,0.78)]">{BRAND.promise}</p>
      </div>
      <div className="mx-auto w-full max-w-[420px] lg:mx-0">
        <div className="mb-6 text-center lg:hidden">
          <BrandMark className="mx-auto h-12 w-12" />
          <p className="mt-3 font-marketing text-2xl font-bold text-[#F3FAF5]">{BRAND.product}</p>
        </div>
        <div className="shadow-login rounded-2xl bg-white p-6 text-left text-[#0E1F1A]">
          <h2 className="text-lg font-bold tracking-tight text-[#0E1F1A]">Sign in to your chapter</h2>
          <p className="mt-1 mb-5 text-sm font-medium text-[#5A6B7D]">
            Enter your member credentials to continue.
          </p>
          <LoginForm />
          <div className="mt-2 border-t border-[#0E1F1A]/10 pt-4 text-sm text-[#5A6B7D]">
            New to your chapter? <strong className="text-[#0E1F1A]">Request an invitation</strong> from
            your accountability partner.
          </div>
        </div>
        <p className="mt-8 text-center font-mono text-[10.5px] tracking-[0.12em] text-white/65 uppercase">
          Membership is by invitation only · {BRAND.product} © {year}
        </p>
      </div>
    </div>
  );
}

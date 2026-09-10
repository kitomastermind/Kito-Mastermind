import { BrandMark } from '@/components/brand/BrandMark';

export default function InactivePage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-5 text-center">
      <BrandMark className="mx-auto h-12 w-12" />
      <h1 className="mt-6 text-2xl font-bold tracking-tight text-[#0E1F1A]">Your account is not active</h1>
      <p className="mt-3 text-sm text-[#5A6B7D]">Contact your chapter lead if you believe this is a mistake.</p>
      <a href="/login" className="btn-primary mx-auto mt-6">
        Back to sign in
      </a>
    </main>
  );
}

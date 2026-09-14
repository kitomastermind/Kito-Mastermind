import { BrandMark } from '@/components/brand/BrandMark';

export default function NotFoundPage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-5 text-center">
      <BrandMark className="mx-auto h-12 w-12" />
      <h1 className="mt-6 text-2xl font-bold tracking-tight text-[#204559]">Page not found</h1>
      <p className="mt-3 text-sm text-[#5A6B7D]">That address is not part of KITO Mastermind.</p>
      <a href="/dashboard" className="btn-primary mx-auto mt-6">
        Go to dashboard
      </a>
    </main>
  );
}

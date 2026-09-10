'use client';

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-5 text-center">
      <h1 className="text-2xl font-bold tracking-tight text-[#0E1F1A]">Something went wrong</h1>
      <p className="mt-3 text-sm text-[#5A6B7D]">Try again. If it continues, contact your chapter lead.</p>
      <button type="button" onClick={reset} className="btn-primary mx-auto mt-6">
        Try again
      </button>
    </main>
  );
}

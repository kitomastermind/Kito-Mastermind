'use client';

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-5 text-center">
      <h1 className="font-display text-3xl font-[450] text-primary">
        Something went wrong
      </h1>
      <p className="mt-3 text-sm text-muted">
        Try again. If it continues, contact your chapter lead.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-6 h-11 rounded-[4px] bg-secondary px-4 font-semibold text-primary-deep"
      >
        Try again
      </button>
    </main>
  );
}

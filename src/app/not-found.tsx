export default function NotFoundPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-5 text-center">
      <h1 className="font-display text-3xl font-[450] text-primary">Page not found</h1>
      <p className="mt-3 text-sm text-muted">
        That address is not part of KITO Mastermind.
      </p>
      <a href="/dashboard" className="mt-6 text-primary-soft">
        Go to dashboard
      </a>
    </main>
  );
}

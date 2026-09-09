export default function InactivePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-5 text-center">
      <h1 className="font-display text-3xl font-[450] text-primary">
        Your account is not active
      </h1>
      <p className="mt-3 text-sm text-muted">
        Contact your chapter lead if you believe this is a mistake.
      </p>
      <a href="/login" className="mt-6 text-primary-soft">
        Back to sign in
      </a>
    </main>
  );
}

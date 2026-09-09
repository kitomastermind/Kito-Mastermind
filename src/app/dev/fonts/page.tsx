import { notFound } from 'next/navigation';

export default function FontsPage() {
  if (process.env.NODE_ENV === 'production') {
    notFound();
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col gap-8 bg-cream p-8 text-ink">
      <p className="font-display text-[28px] font-[450]">
        Fraunces — KITO Mastermind
      </p>
      <p className="font-sans text-base font-normal">
        Inter — body copy for forms, tables and buttons.
      </p>
      <p className="font-mono text-[11px] font-medium uppercase tracking-[0.22em] text-secondary">
        IBM Plex Mono — chapter network
      </p>
    </main>
  );
}

import { notFound } from 'next/navigation';

export default function FontsPage() {
  if (process.env.NODE_ENV === 'production') {
    notFound();
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col gap-8 bg-[#EEF2EE] p-8 text-[#0E1F1A]">
      <p className="font-display text-[28px] font-bold">Plus Jakarta Sans — portal UI</p>
      <p className="font-marketing text-[28px] font-bold">Space Grotesk — marketing display</p>
      <p className="font-body-mk text-base font-normal">Inter — marketing body</p>
      <p className="font-mono text-[11px] font-medium tracking-[0.22em] text-[#3B7A4E] uppercase">
        IBM Plex Mono — IDs and badges
      </p>
    </main>
  );
}

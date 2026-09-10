import { cn } from '@/lib/utils';

/** KITO monogram: forest tile + K strokes + lime node. Not the IOUX U. */
export function BrandMark({ className, title = 'KITO' }: { className?: string; title?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      className={cn('h-9 w-9 shrink-0', className)}
      role="img"
      aria-label={title}
    >
      <rect width="40" height="40" rx="10" fill="#0E1F1A" />
      <path
        d="M13 11v18M13 20L27.5 11.2M13 20L27.5 28.8"
        stroke="#F3FAF5"
        strokeWidth="3.25"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <circle cx="29.5" cy="11" r="3.4" fill="#D3F36B" />
    </svg>
  );
}

export function NavBrandMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cn('h-7 w-7', className)} aria-hidden>
      <path
        d="M6.5 4.5v15M6.5 12L17 5.2M6.5 12L17 18.8"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <circle cx="18" cy="6" r="2.6" fill="#D3F36B" />
    </svg>
  );
}

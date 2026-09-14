import { cn } from '@/lib/utils';

const TEAL = '#204559';
const OLIVE = '#9BA63E';

/** Compact tile: teal field, official thin K. */
export function BrandMark({ className, title = 'KITO' }: { className?: string; title?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      className={cn('h-9 w-9 shrink-0', className)}
      role="img"
      aria-label={title}
    >
      <rect width="40" height="40" rx="8" fill={TEAL} />
      <g fill="none" stroke={OLIVE} strokeWidth="2.2" strokeLinecap="butt">
        <path d="M13 10v20" />
        <path d="M18.5 10L28 10L19.5 20" />
        <path d="M13 20L28 30" />
      </g>
    </svg>
  );
}

/** Official geometric KITO wordmark. Uses currentColor. */
export function BrandWordmark({
  className,
  title = 'KITO',
  withTagline = false,
}: {
  className?: string;
  title?: string;
  withTagline?: boolean;
}) {
  return (
    <svg
      viewBox={withTagline ? '0 0 360 118' : '0 0 360 72'}
      className={cn('h-8 w-auto shrink-0', className)}
      role="img"
      aria-label={withTagline ? 'KITO — Real People. Exceptional Results.' : title}
    >
      <g fill="none" stroke="currentColor" strokeWidth="5.5" strokeLinecap="butt" strokeLinejoin="miter">
        <path d="M8 8v56" />
        <path d="M22 8h28L32 36" />
        <path d="M8 36L50 64" />
        <path d="M78 8v22" />
        <path d="M78 42v22" />
        <path d="M108 8h62" />
        <path d="M139 8v56" />
        <circle cx="228" cy="36" r="28" />
      </g>
      {withTagline ? (
        <text
          x="8"
          y="104"
          fill="currentColor"
          fontFamily="ui-sans-serif, system-ui, sans-serif"
          fontSize="16"
          letterSpacing="0.08em"
        >
          Real People. Exceptional Results.
        </text>
      ) : null}
    </svg>
  );
}

export function NavBrandMark({ className }: { className?: string }) {
  return <BrandWordmark className={cn('h-7 w-auto', className)} />;
}

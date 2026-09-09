import { cn } from '@/lib/utils';

export function Eyebrow({
  children,
  tone = 'secondary',
}: {
  children: React.ReactNode;
  tone?: 'secondary' | 'muted';
}) {
  return (
    <p
      className={cn(
        'font-mono text-[11px] font-medium uppercase tracking-[0.22em]',
        tone === 'secondary' ? 'text-secondary' : 'text-muted',
      )}
    >
      {children}
    </p>
  );
}

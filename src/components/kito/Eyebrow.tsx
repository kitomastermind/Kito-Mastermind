import { cn } from '@/lib/utils';

export function Eyebrow({
  children,
  tone = 'secondary',
}: {
  children: React.ReactNode;
  tone?: 'secondary' | 'muted' | 'onDark';
}) {
  return (
    <p
      className={cn(
        'font-mono text-[11px] font-medium uppercase tracking-[0.22em]',
        tone === 'muted' && 'text-muted',
        tone === 'secondary' && 'text-primary',
        tone === 'onDark' && 'text-chart-4',
      )}
    >
      {children}
    </p>
  );
}

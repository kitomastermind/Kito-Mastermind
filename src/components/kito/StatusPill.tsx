import { cn } from '@/lib/utils';

const TONES = {
  paid: 'bg-secondary-pale text-primary',
  pending: 'bg-danger-pale text-danger-ink',
  due: 'bg-danger-pale text-danger-ink',
  overdue: 'bg-danger-pale text-danger-ink',
  verify: 'bg-secondary-pale text-primary',
  completed: 'bg-secondary-pale text-primary',
  neutral: 'bg-cream-dim text-muted',
} as const;

export function StatusPill({
  tone,
  children,
}: {
  tone: keyof typeof TONES;
  children: React.ReactNode;
}) {
  return (
    <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', TONES[tone])}>
      {children}
    </span>
  );
}

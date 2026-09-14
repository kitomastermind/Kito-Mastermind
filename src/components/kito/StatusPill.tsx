import { cn } from '@/lib/utils';

const TONES = {
  paid: 'bg-[#EEF1D6] text-[#2D5F75]',
  pending: 'bg-[#F4F6E4] text-[#5C641F]',
  due: 'bg-[#F4F6E4] text-[#5C641F]',
  overdue: 'bg-red-50 text-red-700',
  verify: 'bg-[#EEF1D6] text-[#2D5F75]',
  completed: 'bg-[#EEF1D6] text-[#2D5F75]',
  neutral: 'bg-[#F7FAF6] text-[#5A6B7D]',
} as const;

export function StatusPill({
  tone,
  children,
}: {
  tone: keyof typeof TONES;
  children: React.ReactNode;
}) {
  return (
    <span className={cn('rounded-md px-2 py-0.5 font-mono text-xs font-medium uppercase', TONES[tone])}>
      {children}
    </span>
  );
}

import { cn } from '@/lib/utils';

const TONES = {
  paid: 'bg-[#F4FBE3] text-[#1A3A2E]',
  pending: 'bg-[#FFF8E0] text-[#8A6A00]',
  due: 'bg-[#FFF8E0] text-[#8A6A00]',
  overdue: 'bg-red-50 text-red-700',
  verify: 'bg-[#F4FBE3] text-[#1A3A2E]',
  completed: 'bg-[#F4FBE3] text-[#1A3A2E]',
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

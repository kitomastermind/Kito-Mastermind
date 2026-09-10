import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

const ACCENT = {
  lime: 'bg-[#D3F36B]',
  gold: 'bg-[#F0C419]',
  forest: 'bg-[#0E1F1A]',
  red: 'bg-red-600',
} as const;

const WELL = {
  lime: 'bg-[#D3F36B]/25 text-[#0E1F1A]',
  gold: 'bg-[#FFF8E0] text-[#8A6A00]',
  forest: 'bg-[#0E1F1A]/10 text-[#0E1F1A]',
  red: 'bg-red-50 text-red-700',
} as const;

export function StatCard({
  label,
  value,
  unit,
  sub,
  subTone = 'default',
  segments,
  accent = 'lime',
  icon: Icon,
}: {
  label: string;
  value: string;
  unit?: string;
  sub?: string;
  subTone?: 'default' | 'up' | 'warn';
  segments?: { label: string; points: number; color: string }[];
  accent?: keyof typeof ACCENT;
  icon?: LucideIcon;
}) {
  return (
    <article className="stat-card">
      <span className={cn('stat-card__bar', ACCENT[accent])} aria-hidden />
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] font-semibold text-[#5A6B7D]">{label}</p>
        {Icon ? (
          <span className={cn('flex h-7 w-7 items-center justify-center rounded-md', WELL[accent])}>
            <Icon size={14} strokeWidth={1.75} />
          </span>
        ) : null}
      </div>
      <p className="mt-1 text-lg font-extrabold tracking-tight text-[#0E1F1A] sm:text-xl">
        {value}
        {unit ? <span className="ml-1 text-sm font-medium text-[#5A6B7D]">{unit}</span> : null}
      </p>
      {sub ? (
        <p
          className={cn(
            'mt-1 text-[11px] font-medium',
            subTone === 'up' && 'text-[#1A3A2E]',
            subTone === 'warn' && 'text-[#8A6A00]',
            subTone === 'default' && 'text-[#5A6B7D]',
          )}
        >
          {sub}
        </p>
      ) : null}
      {segments ? <SegmentedBar segments={segments} total={segments.reduce((sum, item) => sum + item.points, 0)} /> : null}
    </article>
  );
}

export function SegmentedBar({
  segments,
  total,
}: {
  segments: { label: string; points: number; color: string }[];
  total: number;
}) {
  if (total <= 0) {
    return <div className="mt-3 h-2 rounded-full bg-[#F7FAF6]" />;
  }
  return (
    <div className="mt-3 flex h-2 overflow-hidden rounded-full">
      {segments.map((segment) => (
        <span
          key={segment.label}
          title={`${segment.label}: ${segment.points}`}
          className="h-full"
          style={{ width: `${(segment.points / total) * 100}%`, background: `var(--color-${segment.color})` }}
        />
      ))}
    </div>
  );
}

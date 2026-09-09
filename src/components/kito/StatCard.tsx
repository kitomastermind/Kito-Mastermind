import { cn } from '@/lib/utils';

export function StatCard({
  label,
  value,
  unit,
  sub,
  subTone = 'default',
  segments,
}: {
  label: string;
  value: string;
  unit?: string;
  sub?: string;
  subTone?: 'default' | 'up' | 'warn';
  segments?: { label: string; points: number; color: string }[];
}) {
  return (
    <article className="min-w-[220px] snap-start rounded-[6px] border border-line bg-cream-flat p-4">
      <p className="text-[11px] font-semibold tracking-[0.05em] text-muted uppercase">{label}</p>
      <p className="mt-2 font-display text-3xl font-[450] text-primary">
        {value}
        {unit ? <span className="ml-1 text-base text-muted">{unit}</span> : null}
      </p>
      {sub ? (
        <p
          className={cn(
            'mt-1 text-sm',
            subTone === 'up' && 'text-secondary-deep',
            subTone === 'warn' && 'text-danger-ink',
            subTone === 'default' && 'text-muted',
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
    return <div className="mt-3 h-2 rounded-full bg-line" />;
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

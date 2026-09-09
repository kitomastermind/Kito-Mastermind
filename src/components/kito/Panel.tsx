import { cn } from '@/lib/utils';

export function Panel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn('rounded-[6px] border border-line bg-cream-flat', className)}>
      {children}
    </section>
  );
}

export function PanelHead({
  title,
  action,
  count,
}: {
  title: string;
  action?: { label: string; href: string };
  count?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
      <h2 className="font-display text-lg font-[450] text-primary">{title}</h2>
      {count ? (
        <span className="rounded-full bg-secondary-pale px-2 py-0.5 text-xs text-primary">
          {count}
        </span>
      ) : null}
      {action ? (
        <a className="text-sm text-primary-soft underline-offset-2 hover:underline" href={action.href}>
          {action.label}
        </a>
      ) : null}
    </div>
  );
}

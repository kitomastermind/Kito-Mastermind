import Link from 'next/link';
import { cn } from '@/lib/utils';

export function Panel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <section className={cn('portal-section', className)}>{children}</section>;
}

export function PanelHead({
  title,
  action,
  count,
  description,
}: {
  title: string;
  action?: { label: string; href: string };
  count?: string;
  description?: string;
}) {
  return (
    <header className="portal-section__head">
      <div>
        <h2 className="portal-section__title">{title}</h2>
        {description ? <p className="portal-section__desc">{description}</p> : null}
      </div>
      {count ? (
        <span className="rounded-md bg-[#EEF1D6] px-2 py-0.5 font-mono text-xs font-medium text-[#2D5F75] uppercase">
          {count}
        </span>
      ) : null}
      {action ? (
        <Link prefetch className="text-xs font-semibold text-[#204559]" href={action.href}>
          {action.label}
        </Link>
      ) : null}
    </header>
  );
}

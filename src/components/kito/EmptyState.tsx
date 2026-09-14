import Link from 'next/link';

export function EmptyState({
  heading,
  body,
  action,
}: {
  icon?: React.ReactNode;
  heading: string;
  body: string;
  action?: { label: string; href: string };
}) {
  return (
    <div className="portal-empty m-3">
      <h3 className="text-sm font-bold text-[#204559]">{heading}</h3>
      <p className="mt-1 text-[11px] font-medium text-[#5A6B7D]">{body}</p>
      {action ? (
        <Link prefetch href={action.href} className="btn-primary mt-3">
          {action.label}
        </Link>
      ) : null}
    </div>
  );
}

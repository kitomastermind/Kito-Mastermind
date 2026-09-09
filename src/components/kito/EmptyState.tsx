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
    <div className="px-4 py-10 text-center">
      <h3 className="font-display text-xl font-[450] text-primary">{heading}</h3>
      <p className="mt-2 text-sm text-muted">{body}</p>
      {action ? (
        <a
          href={action.href}
          className="mt-4 inline-flex h-11 items-center rounded-[4px] bg-secondary px-4 font-semibold text-primary-deep"
        >
          {action.label}
        </a>
      ) : null}
    </div>
  );
}

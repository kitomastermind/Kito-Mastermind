export function PageHeader({
  eyebrow,
  title,
  subtitle,
  right,
  actions,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  const support = subtitle ?? eyebrow;
  const cluster = actions ?? right;
  return (
    <header className="page-hero">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-2.5">
          <span className="mt-1.5 h-4 w-1 shrink-0 rounded-full bg-[#D3F36B]" aria-hidden />
          <div>
            <h1 className="font-display text-base leading-tight font-bold tracking-tight text-white sm:text-lg">
              {title}
            </h1>
            {support ? (
              <p className="mt-0.5 max-w-3xl text-xs leading-snug font-medium text-white/65">{support}</p>
            ) : null}
          </div>
        </div>
        {cluster ? <div className="pl-3.5 sm:pl-0">{cluster}</div> : null}
      </div>
    </header>
  );
}

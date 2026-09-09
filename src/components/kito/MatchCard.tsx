import { StatusPill } from '@/components/kito/StatusPill';
import { LockStrip } from '@/components/kito/interactive';

export function MatchCard({
  ownerName,
  loggedAt,
  chapterName,
  score,
  facets,
  requestState,
}: {
  ownerName: string;
  loggedAt: string;
  chapterName: string;
  score: number;
  facets: { label: string; kind: 'exact' | 'partial' }[];
  onRequest?: () => void;
  onMessage?: () => void;
  requestState: 'pending' | 'requested' | 'granted' | 'declined';
}) {
  const strong = score >= 80;
  return (
    <article className="rounded-[6px] border border-line bg-cream-flat p-4">
      <p className="text-sm text-ink">Existing lead by {ownerName}</p>
      <p className="text-xs text-muted">
        Logged {loggedAt} · {chapterName} Chapter
      </p>
      <span
        className={
          strong
            ? 'mt-2 inline-block rounded-full bg-secondary-pale px-2 py-0.5 text-xs'
            : 'mt-2 inline-block rounded-full bg-danger-pale px-2 py-0.5 text-xs text-danger-ink'
        }
      >
        {score}
      </span>
      <div className="mt-2 flex flex-wrap gap-1">
        {facets.map((facet) => (
          <span key={facet.label} className="rounded-full bg-cream-dim px-2 py-0.5 text-xs">
            {facet.kind === 'exact' ? '✓' : '~'} {facet.label}
          </span>
        ))}
      </div>
      <div className="mt-3">
        <LockStrip ownerFirstName={ownerName.split(' ')[0] ?? ownerName} />
      </div>
      <p className="mt-2">
        <StatusPill
          tone={
            requestState === 'granted'
              ? 'paid'
              : requestState === 'declined'
                ? 'overdue'
                : requestState === 'requested'
                  ? 'pending'
                  : 'neutral'
          }
        >
          {requestState}
        </StatusPill>
      </p>
    </article>
  );
}

export function MoneyText({ cents, compact }: { cents: string; compact?: boolean }) {
  const zero = BigInt(0);
  const hundred = BigInt(100);
  const million = BigInt(1000000);
  const hundredThousand = BigInt(100000);
  const value = BigInt(cents);
  const sign = value < zero ? '-' : '';
  const abs = value < zero ? -value : value;
  const whole = abs / hundred;
  const frac = abs % hundred;
  if (compact && whole >= million) {
    const millions = whole / million;
    const tenth = (whole % million) / hundredThousand;
    return (
      <span>
        {sign}
        {millions.toString()}.{tenth.toString()}M KES
      </span>
    );
  }
  const grouped = whole.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const amount = frac === zero ? grouped : `${grouped}.${frac.toString().padStart(2, '0')}`;
  return (
    <span>
      KES {sign}
      {amount}
    </span>
  );
}

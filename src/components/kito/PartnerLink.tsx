import { AvatarInitials } from '@/components/kito/AvatarInitials';

export function PartnerLink({
  me,
  partner,
  pairedSince,
  metrics,
}: {
  me: string;
  partner: string | null;
  pairedSince: string | null;
  metrics?: { mutualRate: string; stepsTogether: string };
}) {
  if (!partner) {
    return (
      <p className="text-sm text-muted">
        You are not currently paired. Your chapter lead assigns partners at the start of each cycle.
      </p>
    );
  }
  return (
    <div className="flex items-center gap-3">
      <AvatarInitials name={me} />
      <span className="h-px w-8 bg-line" />
      <AvatarInitials name={partner} tone="secondary" />
      <div>
        <p className="text-sm text-ink">
          {me} · {partner}
        </p>
        <p className="text-xs text-muted">Paired since {pairedSince}</p>
        {metrics ? (
          <p className="text-xs text-muted">
            {metrics.mutualRate} mutual · {metrics.stepsTogether} together
          </p>
        ) : null}
      </div>
    </div>
  );
}

export function PipelineRow({
  memberName,
  activeCount,
  stages,
  leadingIndex,
}: {
  memberName: string;
  activeCount: number;
  stages: boolean[];
  leadingIndex: number;
}) {
  return (
    <div className="flex items-center gap-3 py-2">
      <p className="w-36 truncate text-sm">{memberName}</p>
      <p className="w-10 text-xs text-muted">{activeCount}</p>
      <div className="flex gap-1">
        {stages.map((filled, index) => (
          <span
            key={`${memberName}-${index}`}
            className={
              filled
                ? index === leadingIndex
                  ? 'size-4 bg-secondary'
                  : 'size-4 bg-primary-soft'
                : 'size-4 bg-line'
            }
          />
        ))}
      </div>
    </div>
  );
}

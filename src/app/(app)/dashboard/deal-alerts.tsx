'use client';

import { confirmDealShareAction, verifyDealAction } from '@/server/actions/deals';
import type { DashboardModel } from '@/server/dto/dashboard';
import { useRouter } from 'next/navigation';

export function DealAlerts({
  deals,
  actorId,
  canVerify,
}: {
  deals: DashboardModel['deals'];
  actorId: string;
  canVerify: boolean;
}) {
  const router = useRouter();
  if (deals.length === 0) return null;
  return (
    <ul className="divide-y divide-line">
      {deals.map((deal) => {
        const mine = deal.participants.find((row) => row.profileId === actorId);
        const needsConfirm = Boolean(mine && !mine.confirmedAt && !deal.verifiedAt);
        const needsVerify = canVerify && !deal.verifiedAt;
        return (
          <li key={deal.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
            <div>
              <p className="text-sm text-ink">{deal.saleVolumeLabel} · {deal.closedAt}</p>
              <p className="text-xs text-muted">
                {deal.verifiedAt
                  ? 'Verified'
                  : needsConfirm
                    ? 'Awaiting your confirmation'
                    : 'Awaiting verification'}
              </p>
            </div>
            {needsConfirm ? (
              <button
                type="button"
                className="h-11 rounded-[4px] bg-secondary px-3 text-sm font-semibold text-primary-deep"
                onClick={async () => {
                  await confirmDealShareAction({ dealId: deal.id });
                  router.refresh();
                }}
              >
                Confirm split
              </button>
            ) : null}
            {needsVerify ? (
              <button
                type="button"
                className="h-11 rounded-[4px] border border-line px-3 text-sm"
                onClick={async () => {
                  await verifyDealAction({ dealId: deal.id });
                  router.refresh();
                }}
              >
                Verify
              </button>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}

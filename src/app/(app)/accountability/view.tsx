import { Panel, PanelHead } from '@/components/kito/Panel';
import { StatCard } from '@/components/kito/StatCard';
import { PartnerLink } from '@/components/kito/PartnerLink';
import { EmptyState } from '@/components/kito/EmptyState';
import type { AccountabilityPageModel } from '@/server/dto/accountability';
import { firstName } from '@/lib/format';
import { MyActionsPanel } from './my-actions';
import { PartnerActionsPanel } from './partner-actions';
import { RequestPairingButton } from './request-pairing';

export function AccountabilityView({ model }: { model: AccountabilityPageModel }) {
  return (
    <div className="space-y-6">
      <div className="flex snap-x gap-3 overflow-x-auto pb-2 md:grid md:grid-cols-4 md:overflow-visible">
        <StatCard label="Completion Rate (cycle)" value={model.stats.completionRate} />
        <StatCard label="Current Streak" value={model.stats.streak} />
        <StatCard label="Actions Completed" value={model.stats.completedAllTime} sub="All time" />
        <StatCard label="Chapter Average" value={model.stats.chapterAverage} />
      </div>
      <Panel>
        <PanelHead title="Your partner" />
        <div className="space-y-4 p-4">
          <PartnerLink
            me={model.actorName}
            partner={model.pairing?.partnerName ?? null}
            pairedSince={
              model.pairing
                ? `${model.pairing.startedAt} · ${model.pairing.chapterName} Chapter`
                : null
            }
            metrics={
              model.pairing
                ? {
                    mutualRate: model.pairing.mutualRate,
                    stepsTogether: String(model.pairing.stepsTogether),
                  }
                : undefined
            }
          />
          {model.pairing ? (
            <div className="flex flex-wrap gap-2">
              {model.pairing.partnerEmail ? (
                <a
                  className="inline-flex h-11 items-center rounded-[4px] bg-secondary px-4 text-sm font-semibold text-primary-deep"
                  href={`mailto:${model.pairing.partnerEmail}`}
                >
                  Message {firstName(model.pairing.partnerName)}
                </a>
              ) : null}
              <RequestPairingButton />
            </div>
          ) : null}
        </div>
      </Panel>
      <div className="grid gap-6 lg:grid-cols-2">
        <MyActionsPanel
          actions={model.myActions}
          sessions={model.sessions}
          actorId={model.actorId}
          partnerId={model.pairing?.partnerId ?? null}
          partnerName={model.pairing?.partnerName ?? null}
        />
        <div className="space-y-6">
          <PartnerActionsPanel
            actions={model.partnerActions}
            partnerName={model.pairing?.partnerName ?? 'your partner'}
          />
          <Panel>
            <PanelHead title="Completion trend" />
            {model.trend.length === 0 ? (
              <EmptyState heading="No sessions yet" body="Trend bars appear after you log actions from a session." />
            ) : (
              <div className="flex h-40 items-end gap-2 p-4">
                {model.trend.map((point) => (
                  <div key={point.label} className="flex flex-1 flex-col items-center gap-1">
                    <div
                      className="w-full rounded-t bg-secondary"
                      style={{ height: `${Math.max(point.rate, 4)}%` }}
                      title={`${point.label}: ${point.rate}%`}
                    />
                    <span className="text-[10px] text-muted">{point.label}</span>
                  </div>
                ))}
              </div>
            )}
          </Panel>
          <Panel>
            <PanelHead title="Past partners" />
            {model.pastPartners.length === 0 ? (
              <p className="px-4 py-3 text-sm text-muted">No past partners yet.</p>
            ) : (
              <ul>
                {model.pastPartners.map((row) => (
                  <li key={`${row.partnerId}-${row.endedAt}`} className="border-b border-line px-4 py-3 text-sm">
                    {row.partnerName} · {row.mutualRate} mutual · ended {row.endedAt}
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}

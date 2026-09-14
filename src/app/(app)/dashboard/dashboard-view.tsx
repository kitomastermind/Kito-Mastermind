import { PageHeader } from '@/components/kito/PageHeader';
import { Panel, PanelHead } from '@/components/kito/Panel';
import { StatCard } from '@/components/kito/StatCard';
import { EmptyState } from '@/components/kito/EmptyState';
import { ActionItem } from '@/components/kito/interactive';
import { PipelineRow } from '@/components/kito/PartnerLink';
import { StatusPill } from '@/components/kito/StatusPill';
import type { DashboardModel } from '@/server/dto/dashboard';
import { BarChart3, Handshake, Timer, Wallet } from 'lucide-react';
import Link from 'next/link';
import { DashboardMatchPreview } from './match-preview';
import { DealAlerts } from './deal-alerts';

function actionTone(status: string): 'due' | 'overdue' | 'completed' | 'verify' | 'pending' {
  if (status === 'OVERDUE') return 'overdue';
  if (status === 'COMPLETED') return 'verify';
  if (status === 'VERIFIED') return 'completed';
  if (status === 'IN_PROGRESS') return 'pending';
  return 'due';
}

export function DashboardView({ model }: { model: DashboardModel }) {
  return (
    <>
      <PageHeader
        eyebrow={model.eyebrow}
        title={`Good ${model.greeting}, ${model.firstName}`}
        right={<p className="text-xs font-medium text-white/65">{model.nextSession}</p>}
      />
      <div className="portal-metrics">
        <Link href="/points">
          <StatCard
            label="Points This Cycle"
            value={model.pointsValue ?? '—'}
            sub={model.pointsSub}
            segments={model.segments}
            accent="lime"
            icon={BarChart3}
          />
        </Link>
        <StatCard
          label="Response Time"
          value={model.responseValue ?? '—'}
          sub={model.responseSub}
          accent="gold"
          icon={Timer}
        />
        <StatCard
          label="Closed Volume (Cycle)"
          value={model.volumeValue ?? '—'}
          sub={model.volumeSub}
          accent="forest"
          icon={Wallet}
        />
        <StatCard
          label="Referrals Sent / Received"
          value={model.referralsValue}
          sub={model.referralsSub}
          accent="lime"
          icon={Handshake}
        />
      </div>
      <div className="portal-split--aside">
        <div className="flex flex-col gap-3">
          <Panel>
            <PanelHead title="Your accountability actions" action={{ label: 'View all', href: '/accountability' }} />
            {model.actions.length === 0 ? (
              <EmptyState
                heading="No open action steps"
                body="No open action steps. Your next ones come from the next session."
              />
            ) : (
              model.actions.map((action) => (
                <ActionItem
                  key={`${action.title}-${action.meta}`}
                  title={action.title}
                  meta={action.meta}
                  checked={action.status === 'COMPLETED' || action.status === 'VERIFIED'}
                  strike={action.status === 'COMPLETED' || action.status === 'VERIFIED'}
                  pill={<StatusPill tone={actionTone(action.status)}>{action.status.replaceAll('_', ' ')}</StatusPill>}
                />
              ))
            )}
          </Panel>
          {model.pipeline ? (
            <Panel>
              <PanelHead title="Chapter lead pipeline" />
              <div className="px-4 py-2">
                {model.pipeline.map((row) => (
                  <PipelineRow
                    key={row.memberName}
                    memberName={row.memberName}
                    activeCount={row.activeCount}
                    stages={row.stages}
                    leadingIndex={row.leadingIndex}
                  />
                ))}
              </div>
            </Panel>
          ) : null}
        </div>
        <div className="flex flex-col gap-3">
          {model.deals.some((deal) => !deal.verifiedAt) ? (
            <Panel>
              <PanelHead title="Closed business" />
              <DealAlerts
                deals={model.deals.filter((deal) => !deal.verifiedAt)}
                actorId={model.actorId}
                canVerify={model.canVerifyDeals}
              />
            </Panel>
          ) : null}
          <Panel>
            <PanelHead title="New lead match found" />
            {model.match ? (
              <div className="p-4">
                <DashboardMatchPreview match={model.match} />
              </div>
            ) : (
              <EmptyState
                heading="No matches yet"
                body="Matches appear when another member logs a lead that fits one of yours."
              />
            )}
          </Panel>
          <Panel className="relative overflow-hidden bg-[#204559] text-[#F3FAF5]">
            <div className="relative p-4">
              {model.topic ? (
                <>
                  <p className="font-marketing text-[12px] font-semibold tracking-[0.16em] text-[#9BA63E] uppercase">
                    This month
                  </p>
                  <h2 className="mt-2 text-lg font-bold tracking-tight">{model.topic.title}</h2>
                  <p className="mt-2 text-sm text-white/75">{model.topic.prompt}</p>
                  {model.topic.topHeadline && model.topic.topAuthor ? (
                    <blockquote className="mt-4 border-l-[3px] border-[#9BA63E] pl-3 text-sm">
                      “{model.topic.topHeadline}” — {model.topic.topAuthor}
                    </blockquote>
                  ) : null}
                  <Link href="/forum" className="btn-action-chip mt-4">
                    Post your lesson
                  </Link>
                </>
              ) : (
                <p className="text-sm text-white/75">No topic is open this month yet.</p>
              )}
            </div>
          </Panel>
        </div>
      </div>
    </>
  );
}

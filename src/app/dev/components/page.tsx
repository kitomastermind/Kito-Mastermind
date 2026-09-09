import { notFound } from 'next/navigation';
import { ActionItem, ConfirmDialog, FilterChipRow, LockStrip, Stepper } from '@/components/kito/interactive';
import { EmptyState } from '@/components/kito/EmptyState';
import { Eyebrow } from '@/components/kito/Eyebrow';
import { AvatarInitials } from '@/components/kito/AvatarInitials';
import { LessonCard, NotificationBell } from '@/components/kito/LessonCard';
import { PartnerLink, PipelineRow } from '@/components/kito/PartnerLink';
import { MatchCard, MoneyText } from '@/components/kito/MatchCard';
import { PageHeader } from '@/components/kito/PageHeader';
import { Panel, PanelHead } from '@/components/kito/Panel';
import { StatCard } from '@/components/kito/StatCard';
import { StatusPill } from '@/components/kito/StatusPill';

export default function ComponentsPage() {
  if (process.env.NODE_ENV === 'production') {
    notFound();
  }
  return (
    <main className="mx-auto max-w-4xl space-y-8 bg-cream p-6 text-ink">
      <PageHeader eyebrow="Library" title="KITO components" />
      <Eyebrow>Secondary tone</Eyebrow>
      <Eyebrow tone="muted">Muted tone</Eyebrow>
      <Panel>
        <PanelHead title="Panel" count="2 of 3" action={{ label: 'View all', href: '/accountability' }} />
        <EmptyState heading="Empty" body="Designed empty copy lives here." />
      </Panel>
      <div className="flex gap-3 overflow-x-auto snap-x">
        <StatCard label="Points" value="482 / 600" sub="Rank 3 of 22" />
        <StatCard label="Balance" value="0" sub="Outstanding" subTone="warn" />
      </div>
      <StatusPill tone="paid">Paid</StatusPill>
      <StatusPill tone="overdue">Overdue</StatusPill>
      <ActionItem title="Call five listings" meta="From 9 Jul session" checked={false} />
      <ActionItem title="Done item" meta="Verified" checked strike />
      <LockStrip ownerFirstName="Amara" />
      <MatchCard
        ownerName="Amara Njeri"
        loggedAt="12 Aug"
        chapterName="Nairobi"
        score={95}
        facets={[{ label: 'Lavington', kind: 'exact' }]}
        requestState="pending"
      />
      <LessonCard
        author="Kevin Mwangi"
        chapterName="Nairobi"
        postedAt="Aug 2026"
        headline="Cap the escalation"
        body="Put a written ceiling on the clause."
        avgRating="4.9"
        ratingCount={4}
        replyCount={2}
        myRating={null}
        isTop
        canRate
      />
      <FilterChipRow
        options={[{ id: 'all', label: 'All' }, { id: 'dues', label: 'Dues' }]}
        value="all"
        onChange={() => undefined}
      />
      <Stepper steps={['Details', 'Matching', 'Review']} current={1} />
      <MoneyText cents="3250000" />
      <NotificationBell unreadCount={2} />
      <AvatarInitials name="Grace Wanjiru" />
      <PartnerLink me="Grace Wanjiru" partner="Daniel Otieno" pairedSince="Jul 2026" />
      <PipelineRow
        memberName="Grace Wanjiru"
        activeCount={4}
        stages={[true, true, true, false, false]}
        leadingIndex={2}
      />
      <ConfirmDialog
        title="Revoke access?"
        body="They will lose contact details immediately."
        confirmLabel="Revoke"
        destructive
        open={false}
        onConfirm={() => undefined}
        onClose={() => undefined}
      />
    </main>
  );
}

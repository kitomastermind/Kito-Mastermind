import { notFound } from 'next/navigation';
import { formatNairobiDate } from '@/lib/format';
import { PageHeader } from '@/components/kito/PageHeader';
import { getLeadView } from '@/server/repositories/leads';
import { listAccessPanel } from '@/server/repositories/access';
import { requireActor } from '@/server/supabase/server';
import { LeadDetail } from './detail';

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const actor = await requireActor();
  const { id } = await params;
  const lead = await getLeadView(actor, id);
  if (!lead) notFound();
  const panel = lead.ownerId === actor.id ? await listAccessPanel(lead.id) : null;
  return (
    <>
      <PageHeader
        eyebrow="Lead"
        title={lead.contactVisible ? lead.clientName : (lead.areaLabel ?? 'Matched lead')}
      />
      {lead.contactVisible && lead.ownerId !== actor.id ? (
        <p className="mb-4 rounded-[6px] border border-secondary bg-secondary-pale px-4 py-3 text-sm">
          You have access to this client&apos;s details because {lead.ownerName} approved your request.
        </p>
      ) : null}
      <p className="mb-4 text-sm text-muted">Logged {formatNairobiDate(lead.createdAt)}</p>
      <LeadDetail lead={lead} isOwner={lead.ownerId === actor.id} panel={panel} />
    </>
  );
}

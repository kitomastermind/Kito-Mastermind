import { PageHeader } from '@/components/kito/PageHeader';
import { requireActor } from '@/server/supabase/server';
import { createClient } from '@/server/supabase/server';
import { canReadThread } from '@/server/policy';
import { notFound } from 'next/navigation';

export default async function MatchPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const actor = await requireActor();
  const { id } = await params;
  const supabase = await createClient();
  const { data: match } = await supabase
    .from('lead_matches')
    .select('id, lead_a_id, lead_b_id')
    .eq('id', id)
    .maybeSingle();
  if (!match) notFound();
  const { data: owners } = await supabase
    .from('lead_pool')
    .select('id, owner_id')
    .in('id', [match.lead_a_id, match.lead_b_id]);
  const leadA = owners?.find((row) => row.id === match.lead_a_id);
  const leadB = owners?.find((row) => row.id === match.lead_b_id);
  if (!leadA?.owner_id || !leadB?.owner_id) notFound();
  const decision = canReadThread(
    actor,
    { ownerId: leadA.owner_id },
    { ownerId: leadB.owner_id },
  );
  if (!decision.allow) notFound();
  return (
    <>
      <PageHeader eyebrow="Match" title="Match thread" />
      <p className="text-sm text-muted">
        Messages here are between you and the other matched agent only.
      </p>
    </>
  );
}

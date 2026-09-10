import { PageHeader } from '@/components/kito/PageHeader';
import { requireActor } from '@/server/supabase/server';
import { createClient } from '@/server/supabase/server';
import { canReadThread } from '@/server/policy';
import { formatNairobiDateTime } from '@/lib/format';
import { notFound } from 'next/navigation';
import { MatchThread } from './thread';

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
  const [{ data: owners }, { data: thread }] = await Promise.all([
    supabase
      .from('lead_pool')
      .select('id, owner_id, owner_name')
      .in('id', [match.lead_a_id, match.lead_b_id]),
    supabase.from('match_threads').select('id').eq('match_id', match.id).maybeSingle(),
  ]);
  const leadA = owners?.find((row) => row.id === match.lead_a_id);
  const leadB = owners?.find((row) => row.id === match.lead_b_id);
  if (!leadA?.owner_id || !leadB?.owner_id) notFound();
  const decision = canReadThread(
    actor,
    { ownerId: leadA.owner_id },
    { ownerId: leadB.owner_id },
  );
  if (!decision.allow) notFound();
  const { data: rows } = thread
    ? await supabase.from('match_messages').select('id, author_id, body, sent_at').eq('thread_id', thread.id).order('sent_at')
    : { data: [] as { id: string; author_id: string; body: string; sent_at: string }[] };
  const authorIds = [...new Set((rows ?? []).map((row) => row.author_id))];
  const { data: names } = authorIds.length
    ? await supabase.from('profiles').select('id, full_name').in('id', authorIds)
    : { data: [] as { id: string; full_name: string }[] };
  return (
    <>
      <PageHeader eyebrow="Match" title="Match thread" />
      <p className="mb-4 text-sm text-muted">
        Messages here are between you and {actor.id === leadA.owner_id ? leadB.owner_name : leadA.owner_name} only.
      </p>
      <MatchThread
        matchId={match.id}
        messages={(rows ?? []).map((row) => ({
          id: row.id,
          author: names?.find((item) => item.id === row.author_id)?.full_name ?? 'Member',
          body: row.body,
          sentAt: formatNairobiDateTime(row.sent_at),
        }))}
      />
    </>
  );
}

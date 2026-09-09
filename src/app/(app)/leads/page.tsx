import { PageHeader } from '@/components/kito/PageHeader';
import { listLeadPool, listMyLeads } from '@/server/repositories/leads';
import { requireActor } from '@/server/supabase/server';
import { LeadsBoard } from './board';

export default async function LeadsPage() {
  const actor = await requireActor();
  const [mine, pool] = await Promise.all([listMyLeads(actor), listLeadPool()]);
  return (
    <>
      <PageHeader eyebrow="Chapter pool" title="Leads" />
      <LeadsBoard mine={mine} pool={pool} />
    </>
  );
}

import { PageHeader } from '@/components/kito/PageHeader';
import { requireActor } from '@/server/supabase/server';
import { LeadWizard } from './wizard';

export default async function NewLeadPage() {
  await requireActor();
  return (
    <>
      <PageHeader eyebrow="Leads" title="Log a lead" />
      <LeadWizard />
    </>
  );
}

import { PageHeader } from '@/components/kito/PageHeader';
import { requireActor } from '@/server/supabase/server';
import { LeadWizard } from './wizard';

export default async function NewLeadPage() {
  await requireActor();
  return (
    <>
      <PageHeader eyebrow="Leads" title="Log a lead" />
      <div className="portal-callout">
        Client name, phone, email and notes stay yours. Matching members see a sealed card until you grant access.
      </div>
      <LeadWizard />
    </>
  );
}

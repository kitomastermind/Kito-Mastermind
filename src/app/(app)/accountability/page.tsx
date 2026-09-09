import { PageHeader } from '@/components/kito/PageHeader';
import { loadAccountabilityPage } from '@/server/repositories/accountability';
import { requireActor } from '@/server/supabase/server';
import { AccountabilityView } from './view';

export default async function AccountabilityPage() {
  const actor = await requireActor();
  const model = await loadAccountabilityPage(actor);
  return (
    <>
      <PageHeader eyebrow="Follow-through" title="Accountability" />
      <AccountabilityView model={model} />
    </>
  );
}

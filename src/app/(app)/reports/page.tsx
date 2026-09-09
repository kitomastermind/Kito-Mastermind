import { EmptyState } from '@/components/kito/EmptyState';
import { PageHeader } from '@/components/kito/PageHeader';
import { requireActor } from '@/server/supabase/server';

export default async function ReportsPage() {
  await requireActor();
  return (
    <>
      <PageHeader eyebrow="Ledger" title="Contributions and reports" />
      <EmptyState heading="No contributions recorded yet" body="Dues, fines and event fees will land here once they are recorded." />
    </>
  );
}

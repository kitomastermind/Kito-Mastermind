import { EmptyState } from '@/components/kito/EmptyState';
import { PageHeader } from '@/components/kito/PageHeader';
import { requireActor } from '@/server/supabase/server';

export default async function LeadsPage() {
  await requireActor();
  return (
    <>
      <PageHeader eyebrow="Chapter pool" title="Leads" />
      <EmptyState
        heading="No leads on the board yet"
        body="Matches appear when another member logs a lead that fits one of yours."
        action={{ label: 'Log a lead', href: '/leads/new' }}
      />
    </>
  );
}

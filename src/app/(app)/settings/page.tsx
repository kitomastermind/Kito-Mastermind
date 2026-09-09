import { PageHeader } from '@/components/kito/PageHeader';
import { requireActor } from '@/server/supabase/server';

export default async function SettingsPage() {
  const actor = await requireActor();
  return (
    <>
      <PageHeader eyebrow="Account" title="Settings" />
      <p className="text-sm text-muted">{actor.fullName} · {actor.role}</p>
    </>
  );
}

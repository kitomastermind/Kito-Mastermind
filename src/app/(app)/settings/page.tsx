import { PageHeader } from '@/components/kito/PageHeader';
import { createClient, requireActor } from '@/server/supabase/server';
import { SettingsForm } from './form';

export default async function SettingsPage() {
  const actor = await requireActor();
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, phone, brokerage')
    .eq('id', actor.id)
    .single();
  const { data: prefs } = await supabase
    .from('notification_preferences')
    .select('email_digest, email_immediate')
    .eq('profile_id', actor.id)
    .maybeSingle();
  return (
    <>
      <PageHeader eyebrow="Account" title="Settings" />
      <div className="portal-callout">
        Profile details stay inside your chapter. Client PII never lives on this screen.
      </div>
      <SettingsForm
        fullName={profile?.full_name ?? actor.fullName}
        phone={profile?.phone ?? ''}
        brokerage={profile?.brokerage ?? ''}
        digest={prefs?.email_digest ?? true}
        immediate={prefs?.email_immediate ?? []}
      />
    </>
  );
}

import { supabaseAdmin } from '@/server/admin/client';
import { sendNotificationEmail } from '@/server/email/notification';
import { isImmediateEmailType } from '@/server/services/notification-copy';

export async function sendDailyDigests(): Promise<{ sent: number; skipped: number }> {
  const { data: pending, error } = await supabaseAdmin
    .from('notifications')
    .select('id, profile_id, type, title, body, emailed_at')
    .is('emailed_at', null);
  if (error) throw error;

  const digestable = (pending ?? []).filter((row) => !isImmediateEmailType(row.type));
  const byProfile = new Map<string, typeof digestable>();
  for (const row of digestable) {
    const list = byProfile.get(row.profile_id) ?? [];
    list.push(row);
    byProfile.set(row.profile_id, list);
  }

  let sent = 0;
  let skipped = 0;
  for (const [profileId, rows] of byProfile) {
    const { data: prefs } = await supabaseAdmin
      .from('notification_preferences')
      .select('email_digest')
      .eq('profile_id', profileId)
      .maybeSingle();
    if (!prefs?.email_digest || rows.length === 0) {
      skipped += 1;
      continue;
    }
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('email')
      .eq('id', profileId)
      .maybeSingle();
    if (!profile?.email) {
      skipped += 1;
      continue;
    }
    const body = rows.map((row) => `${row.title}: ${row.body}`).join('\n');
    await sendNotificationEmail(profile.email, 'Your KITO Mastermind digest', body);
    const ids = rows.map((row) => row.id);
    await supabaseAdmin
      .from('notifications')
      .update({ emailed_at: new Date().toISOString() })
      .in('id', ids);
    sent += 1;
  }
  return { sent, skipped };
}

import { supabaseAdmin } from '@/server/admin/client';
import { sendNotificationEmail } from '@/server/email/notification';
import { logger } from '@/lib/logger';
import {
  isImmediateEmailType,
  type NotificationCopy,
  type NotificationType,
} from '@/server/services/notification-copy';

export async function deliverNotification(input: {
  profileId: string;
  type: NotificationType;
  copy: NotificationCopy;
}): Promise<void> {
  const { data, error } = await supabaseAdmin
    .from('notifications')
    .insert({
      profile_id: input.profileId,
      type: input.type,
      title: input.copy.title,
      body: input.copy.body,
      link_path: input.copy.linkPath,
    })
    .select('id')
    .single();
  if (error) throw error;
  if (!data || !isImmediateEmailType(input.type)) return;
  await emailIfPreferred(input.profileId, input.type, input.copy, data.id);
}

export async function emailIfPreferred(
  profileId: string,
  type: NotificationType,
  copy: NotificationCopy,
  notificationId?: string,
): Promise<void> {
  const { data: prefs, error: prefError } = await supabaseAdmin
    .from('notification_preferences')
    .select('email_immediate')
    .eq('profile_id', profileId)
    .maybeSingle();
  if (prefError) throw prefError;
  const allowed = prefs?.email_immediate ?? [];
  if (!allowed.includes(type)) return;
  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('email')
    .eq('id', profileId)
    .maybeSingle();
  if (profileError) throw profileError;
  if (!profile?.email) {
    logger.warn('notification-email-skipped', { reason: 'no-email' });
    return;
  }
  await sendNotificationEmail(profile.email, copy.title, copy.body);
  if (notificationId) {
    await supabaseAdmin
      .from('notifications')
      .update({ emailed_at: new Date().toISOString() })
      .eq('id', notificationId);
  }
}

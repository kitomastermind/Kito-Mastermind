'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient, requireActor } from '@/server/supabase/server';
import type { ActionResult } from '@/server/actions/result';

export async function markNotificationReadAction(
  input: unknown,
): Promise<ActionResult<void>> {
  const actor = await requireActor();
  const parsed = z.object({ id: z.string().uuid() }).safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Notification is required.' };
  const supabase = await createClient();
  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', parsed.data.id)
    .eq('profile_id', actor.id)
    .is('read_at', null);
  if (error) throw error;
  revalidatePath('/notifications');
  revalidatePath('/dashboard');
  return { ok: true, data: undefined };
}

export async function markAllNotificationsReadAction(): Promise<ActionResult<void>> {
  const actor = await requireActor();
  const supabase = await createClient();
  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('profile_id', actor.id)
    .is('read_at', null);
  if (error) throw error;
  revalidatePath('/notifications');
  revalidatePath('/dashboard');
  return { ok: true, data: undefined };
}

'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { createClient, requireActor } from '@/server/supabase/server';
import type { ActionResult } from '@/server/actions/result';
import type { Database } from '@/lib/types/database';

export async function updateProfileAction(input: unknown): Promise<ActionResult<void>> {
  const actor = await requireActor();
  const parsed = z
    .object({
      fullName: z.string().min(2).max(120),
      phone: z.string().max(20).optional(),
      brokerage: z.string().max(120).optional(),
    })
    .safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Check your profile fields.' };
  const supabase = await createClient();
  const { error } = await supabase
    .from('profiles')
    .update({
      full_name: parsed.data.fullName,
      phone: parsed.data.phone || null,
      brokerage: parsed.data.brokerage || null,
    })
    .eq('id', actor.id);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/settings');
  return { ok: true, data: undefined };
}

export async function updateEmailPreferencesAction(input: unknown): Promise<ActionResult<void>> {
  const actor = await requireActor();
  const parsed = z
    .object({
      digest: z.boolean(),
      immediate: z.array(z.string()),
    })
    .safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Preferences are required.' };
  const supabase = await createClient();
  const { error } = await supabase.from('notification_preferences').upsert({
    profile_id: actor.id,
    email_digest: parsed.data.digest,
    email_immediate: parsed.data.immediate as Database['public']['Enums']['notification_type'][],
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath('/settings');
  return { ok: true, data: undefined };
}

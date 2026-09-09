'use server';

import { z } from 'zod';
import { requireActor } from '@/server/supabase/server';
import { createClient } from '@/server/supabase/server';
import { signedStatementUrl } from '@/server/admin/statements';
import type { ActionResult } from '@/server/actions/result';

export async function downloadStatementAction(
  input: unknown,
): Promise<ActionResult<{ url: string }>> {
  const actor = await requireActor();
  const parsed = z.object({ id: z.string().uuid() }).safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Statement is required.' };
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('statements')
    .select('id, file_key, profile_id')
    .eq('id', parsed.data.id)
    .eq('profile_id', actor.id)
    .maybeSingle();
  if (error || !data) return { ok: false, error: 'Statement not found.' };
  const url = await signedStatementUrl(data.file_key);
  if (!url) return { ok: false, error: 'Download link expired. Generate again.' };
  return { ok: true, data: { url } };
}

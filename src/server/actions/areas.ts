'use server';

import { z } from 'zod';
import { requireActor } from '@/server/supabase/server';
import { createClient } from '@/server/supabase/server';
import type { ActionResult } from '@/server/actions/result';

export type AreaOption = {
  id: string;
  city: string;
  name: string;
  parentId: string | null;
  score: number;
};

export async function searchAreasAction(
  input: unknown,
): Promise<ActionResult<AreaOption[]>> {
  await requireActor();
  const parsed = z.object({ query: z.string().min(2).max(80) }).safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: 'Type at least two characters.', fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('search_areas', {
    p_query: parsed.data.query.trim(),
  });
  if (error) throw error;
  return {
    ok: true,
    data: (data ?? []).map((row) => ({
      id: row.id,
      city: row.city,
      name: row.name,
      parentId: row.parent_id,
      score: row.score,
    })),
  };
}

import { supabaseAdmin } from '@/server/admin/client';

const WINDOWS: Record<string, { max: number; ms: number }> = {
  ACCESS_REQUEST: { max: 8, ms: 60 * 60 * 1000 },
  NUDGE: { max: 10, ms: 60 * 60 * 1000 },
  MATCH_MESSAGE: { max: 40, ms: 60 * 60 * 1000 },
  STATEMENT: { max: 6, ms: 60 * 60 * 1000 },
};

export async function assertRateLimit(
  profileId: string,
  action: keyof typeof WINDOWS,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const spec = WINDOWS[action];
  if (!spec) return { ok: false, error: 'Unknown action.' };
  const now = Date.now();
  const { data: row } = await supabaseAdmin
    .from('rate_limits')
    .select('window_started_at, hit_count')
    .eq('profile_id', profileId)
    .eq('action', action)
    .maybeSingle();
  const started = row ? new Date(row.window_started_at).getTime() : 0;
  const fresh = !row || now - started >= spec.ms;
  const nextCount = fresh ? 1 : row.hit_count + 1;
  if (!fresh && nextCount > spec.max) {
    return { ok: false, error: 'Too many attempts. Try again in an hour.' };
  }
  const { error } = await supabaseAdmin.from('rate_limits').upsert({
    profile_id: profileId,
    action,
    window_started_at: fresh ? new Date(now).toISOString() : row.window_started_at,
    hit_count: nextCount,
  });
  if (error) throw error;
  return { ok: true };
}

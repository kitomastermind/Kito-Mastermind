import { describe, expect, it } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import { loadLocalEnv } from '../../supabase/seed/env';

loadLocalEnv();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;

describe('recalculate-points cron', () => {
  it(
    'two runs produce an identical row set',
    async () => {
      if (!url || !service) throw new Error('Supabase env is not configured');
      const admin = createClient(url, service, { auth: { persistSession: false } });
      const { recalculateAllCurrentCycle } = await import('@/server/admin/recalculate-points');
      await recalculateAllCurrentCycle();
      const { data: first, error: firstError } = await admin
        .from('points_entries')
        .select('profile_id, cycle_id, category, source_type, source_id, points, reason')
        .order('profile_id')
        .order('cycle_id')
        .order('category')
        .order('source_type')
        .order('source_id');
      if (firstError) throw firstError;
      await recalculateAllCurrentCycle();
      const { data: second, error: secondError } = await admin
        .from('points_entries')
        .select('profile_id, cycle_id, category, source_type, source_id, points, reason')
        .order('profile_id')
        .order('cycle_id')
        .order('category')
        .order('source_type')
        .order('source_id');
      if (secondError) throw secondError;
      expect(second).toEqual(first);
      expect((first ?? []).length).toBeGreaterThan(0);
    },
    60_000,
  );
});

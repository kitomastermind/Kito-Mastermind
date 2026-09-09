import { describe, expect, it } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import { loadLocalEnv } from '../../supabase/seed/env';

loadLocalEnv();

describe('rate limits', () => {
  it('refuses a seventh statement attempt in the same window', async () => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !service) throw new Error('Supabase env is not configured');
    const admin = createClient(url, service, { auth: { persistSession: false } });
    const { data: grace } = await admin.from('profiles').select('id').eq('email', 'grace.wanjiru@kito.test').single();
    if (!grace) throw new Error('grace');
    await admin.from('rate_limits').delete().eq('profile_id', grace.id).eq('action', 'STATEMENT');
    const { assertRateLimit } = await import('@/server/admin/rate-limit');
    for (let i = 0; i < 6; i += 1) {
      const ok = await assertRateLimit(grace.id, 'STATEMENT');
      expect(ok.ok).toBe(true);
    }
    const blocked = await assertRateLimit(grace.id, 'STATEMENT');
    expect(blocked.ok).toBe(false);
  }, 30_000);
});

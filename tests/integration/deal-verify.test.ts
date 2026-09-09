import { describe, expect, it } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import { loadLocalEnv } from '../../supabase/seed/env';
import { DEMO_PASSWORD } from '../../supabase/seed/names';

loadLocalEnv();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;

describe('closed business verification', () => {
  it(
    'trigger 3 refuses a split that does not total 100',
    async () => {
      if (!url || !anon || !service) throw new Error('Supabase env is not configured');
      const admin = createClient(url, service, { auth: { persistSession: false } });
      const grace = createClient(url, anon, { auth: { persistSession: false } });
      const { error: signError } = await grace.auth.signInWithPassword({
        email: 'grace.wanjiru@kito.test',
        password: DEMO_PASSWORD,
      });
      if (signError) throw signError;
      const { data: auth } = await grace.auth.getUser();
      if (!auth.user) throw new Error('session');
      const { data: profile } = await grace
        .from('profiles')
        .select('id, chapter_id')
        .eq('id', auth.user.id)
        .single();
      if (!profile) throw new Error('profile');
      const { data: amara } = await admin
        .from('profiles')
        .select('id')
        .eq('email', 'amara.njeri@kito.test')
        .single();
      if (!amara) throw new Error('amara');
      const { data: deal, error: dealError } = await admin
        .from('closed_business')
        .insert({
          chapter_id: profile.chapter_id,
          sale_volume: '100000000',
          closed_at: '2026-09-01',
          created_by: profile.id,
        })
        .select('id')
        .single();
      if (dealError || !deal) throw dealError ?? new Error('deal');
      await admin.from('closed_business_participants').insert([
        {
          closed_business_id: deal.id,
          profile_id: profile.id,
          participant_role: 'CLOSER',
          credit_share: 60,
          confirmed_at: new Date().toISOString(),
        },
        {
          closed_business_id: deal.id,
          profile_id: amara.id,
          participant_role: 'REFERRER',
          credit_share: 50,
          confirmed_at: new Date().toISOString(),
        },
      ]);
      const { error } = await admin
        .from('closed_business')
        .update({
          verified_at: new Date().toISOString(),
          verified_by: profile.id,
        })
        .eq('id', deal.id);
      expect(error?.message ?? '').toMatch(/must be 100/i);
      await admin.from('closed_business').delete().eq('id', deal.id);
    },
    30_000,
  );
});

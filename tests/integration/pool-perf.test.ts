import { describe, expect, it } from 'vitest';
import { dbQuery } from '../../supabase/seed/sql';
import { loadLocalEnv } from '../../supabase/seed/env';

loadLocalEnv();

describe('chapter pool load', () => {
  it('serves 500 leads under 200ms server time', () => {
    dbQuery(`
      insert into public.leads (
        owner_id, chapter_id, lead_type, status, client_name, client_phone,
        property_type, timeline, consent_confirmed, budget_min, budget_max, area_free_text
      )
      select
        p.id, p.chapter_id, 'BUYER', 'NEW',
        'LOAD-' || g, '+254709' || lpad(g::text, 6, '0'),
        'APARTMENT', 'IMMEDIATE', true, 100000000, 150000000, 'Kilimani'
      from generate_series(1, 500) g
      cross join public.profiles p
      where p.email = 'grace.wanjiru@kito.test'
    `);
    try {
      const raw = dbQuery(`
        explain analyze
        select l.id, l.lead_type, l.status, coalesce(a.name, l.area_free_text) as area_label
        from public.leads l
        join public.profiles p on p.id = l.owner_id
        left join public.areas a on a.id = l.area_id
        where l.chapter_id = (select chapter_id from public.profiles where email = 'grace.wanjiru@kito.test')
          and l.pii_purged_at is null
      `);
      const match = raw.match(/Execution Time: ([0-9.]+) ms/);
      const ms = Number(match?.[1] ?? 999);
      expect(ms).toBeLessThan(200);
    } finally {
      dbQuery(`delete from public.leads where client_name like 'LOAD-%'`);
    }
  }, 60_000);
});

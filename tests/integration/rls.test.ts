import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { describe, expect, it } from 'vitest';
import { DEMO_PASSWORD } from '../../supabase/seed/names';
import { loadLocalEnv } from '../../supabase/seed/env';

loadLocalEnv();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function signIn(email: string): Promise<SupabaseClient> {
  if (!url || !anon) throw new Error('Supabase env is not configured');
  const client = createClient(url, anon, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { error } = await client.auth.signInWithPassword({
    email,
    password: DEMO_PASSWORD,
  });
  if (error) throw error;
  return client;
}

describe('leads RLS', () => {
  it('has no admin bypass in the leads select policy', () => {
    const sql = readFileSync(
      resolve(process.cwd(), 'supabase/migrations/20260101000007_rls_policies.sql'),
      'utf8',
    );
    const start = sql.indexOf('create policy leads_select_owner_or_grantee');
    const end = sql.indexOf('create policy leads_insert_self');
    expect(start).toBeGreaterThan(-1);
    expect(end).toBeGreaterThan(start);
    const policy = sql.slice(start, end);
    expect(policy).not.toMatch(/is_admin/);
    expect(policy).toMatch(/has_lead_contact_access/);
  });

  it(
    'hides contact rows from everyone except owner and grantee',
    async () => {
    if (!url || !anon) {
      throw new Error('Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY');
    }

    const owner = await signIn('grace.wanjiru@kito.test');
    const { data: ownLeads, error: ownError } = await owner
      .from('leads')
      .select('id, client_name, owner_id')
      .eq('client_name', 'Susan Kamau');
    expect(ownError).toBeNull();
    const lead = ownLeads?.[0];
    expect(lead?.client_name).toBe('Susan Kamau');
    if (!lead) throw new Error('Seeded Grace lead is missing');

    const grantee = await signIn('amara.njeri@kito.test');
    const { data: granted } = await grantee
      .from('leads')
      .select('id, client_name')
      .eq('id', lead.id);
    expect(granted?.[0]?.client_name).toBe('Susan Kamau');

    const deniedEmails = [
      'lucy.akinyi@kito.test',
      'amina.hassan@kito.test',
      'james.gitonga@kito.test',
    ];
    for (const email of deniedEmails) {
      const client = await signIn(email);
      const { data } = await client.from('leads').select('id, client_name').eq('id', lead.id);
      expect(data, email).toEqual([]);
    }

    const stranger = await signIn('lucy.akinyi@kito.test');
    const { data: pool, error: poolError } = await stranger.from('lead_pool').select('*');
    expect(poolError).toBeNull();
    expect((pool ?? []).length).toBeGreaterThan(0);
    for (const row of pool ?? []) {
      expect(row).not.toHaveProperty('client_name');
      expect(row).not.toHaveProperty('client_phone');
      expect(row).not.toHaveProperty('client_email');
      expect(row).not.toHaveProperty('notes');
    }
    expect((pool ?? []).some((row) => row.id === lead.id)).toBe(true);

    const anonClient = createClient(url, anon, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: anonRows } = await anonClient.from('leads').select('id');
    expect(anonRows ?? []).toEqual([]);
    },
    30_000,
  );
});

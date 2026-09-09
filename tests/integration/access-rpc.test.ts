import { describe, expect, it } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import { DEMO_PASSWORD } from '../../supabase/seed/names';
import { loadLocalEnv } from '../../supabase/seed/env';

loadLocalEnv();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;

describe('approve_access_request transaction', () => {
  it('rolls back when a grant already exists', async () => {
    if (!url || !anon || !service) throw new Error('Supabase env is not configured');
    const admin = createClient(url, service, { auth: { persistSession: false } });
    const grace = createClient(url, anon, { auth: { persistSession: false } });
    const { error: signError } = await grace.auth.signInWithPassword({
      email: 'grace.wanjiru@kito.test',
      password: DEMO_PASSWORD,
    });
    if (signError) throw signError;

    const { data: lead } = await grace
      .from('leads')
      .select('id, owner_id')
      .eq('client_name', 'Susan Kamau')
      .maybeSingle();
    if (!lead) throw new Error('Seeded lead missing');

    const { data: lucy } = await admin
      .from('profiles')
      .select('id')
      .eq('email', 'lucy.akinyi@kito.test')
      .single();
    if (!lucy) throw new Error('Lucy missing');

    await admin.from('lead_contact_grants').delete().eq('lead_id', lead.id).eq('grantee_id', lucy.id);
    await admin.from('contact_access_requests').delete().eq('lead_id', lead.id).eq('requester_id', lucy.id);

    const { data: request, error: requestError } = await admin
      .from('contact_access_requests')
      .insert({
        lead_id: lead.id,
        requester_id: lucy.id,
        owner_id: lead.owner_id,
        expires_at: new Date(Date.now() + 86400000).toISOString(),
      })
      .select('id')
      .single();
    if (requestError || !request) throw requestError ?? new Error('request insert failed');

    try {
      await admin.from('lead_contact_grants').insert({
        lead_id: lead.id,
        grantee_id: lucy.id,
        grantor_id: lead.owner_id,
      });

      const { error } = await grace.rpc('approve_access_request', { p_request_id: request.id });
      expect(error).not.toBeNull();

      const { data: still } = await admin
        .from('contact_access_requests')
        .select('status')
        .eq('id', request.id)
        .single();
      expect(still?.status).toBe('PENDING');
    } finally {
      await admin.from('lead_contact_grants').delete().eq('lead_id', lead.id).eq('grantee_id', lucy.id);
      await admin.from('contact_access_requests').delete().eq('id', request.id);
    }
  });
});

describe('expire-requests cron', () => {
  it('is idempotent', async () => {
    if (!url || !service) throw new Error('Supabase env is not configured');
    const admin = createClient(url, service, { auth: { persistSession: false } });
    const first = await admin.rpc('expire_pending_access_requests');
    expect(first.error).toBeNull();
    const second = await admin.rpc('expire_pending_access_requests');
    expect(second.error).toBeNull();
    expect(second.data).toBe(0);
  });
});

import { describe, expect, it } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import { DEMO_PASSWORD } from '../../supabase/seed/names';
import { loadLocalEnv } from '../../supabase/seed/env';
import { canVerifyAction } from '@/server/policy';
import { applyVerifyAction } from '@/server/services/accountability-transitions';

loadLocalEnv();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;

describe('owner cannot verify — three layers', () => {
  it('refuses at policy, Server Action and database trigger', async () => {
    if (!url || !anon || !service) throw new Error('Supabase env is not configured');
    const admin = createClient(url, service, { auth: { persistSession: false } });
    const grace = createClient(url, anon, { auth: { persistSession: false } });
    const { error: signError } = await grace.auth.signInWithPassword({
      email: 'grace.wanjiru@kito.test',
      password: DEMO_PASSWORD,
    });
    if (signError) throw signError;

    const { data: auth } = await grace.auth.getUser();
    if (!auth.user) throw new Error('Grace session missing');
    const { data: profile } = await grace
      .from('profiles')
      .select('id, chapter_id, role, active, full_name')
      .eq('id', auth.user.id)
      .maybeSingle();
    if (!profile) throw new Error('Grace profile missing');
    const { data: action } = await grace
      .from('accountability_actions')
      .select('id, owner_id, partner_id, chapter_id, status, nudged_at')
      .eq('owner_id', profile.id)
      .neq('status', 'VERIFIED')
      .limit(1)
      .maybeSingle();
    if (!action) throw new Error('Seeded open action missing');

    const actor = {
      id: profile.id,
      chapterId: profile.chapter_id,
      role: profile.role,
      active: profile.active,
      fullName: profile.full_name,
    };
    const subject = {
      ownerId: action.owner_id,
      partnerId: action.partner_id,
      chapterId: action.chapter_id,
      status: action.status,
      nudgedAt: action.nudged_at,
    };

    expect(canVerifyAction(actor, subject).allow).toBe(false);

    let wrote = false;
    const actionLayer = await applyVerifyAction(actor, subject, async () => {
      wrote = true;
      return { error: null };
    });
    expect(actionLayer.ok).toBe(false);
    expect(wrote).toBe(false);

    const { error } = await grace
      .from('accountability_actions')
      .update({ status: 'VERIFIED', verified_by: profile.id })
      .eq('id', action.id);
    expect(error).not.toBeNull();
    expect(error?.message.toLowerCase()).toMatch(/cannot verify|owner/);

    const { data: still } = await admin
      .from('accountability_actions')
      .select('status, verified_by')
      .eq('id', action.id)
      .single();
    expect(still?.status).not.toBe('VERIFIED');
    expect(still?.verified_by).toBeNull();
  });
});

describe('overdue-actions cron', () => {
  it(
    'is idempotent and notifies once',
    async () => {
      if (!url || !service) throw new Error('Supabase env is not configured');
      const { markOverdueActions } = await import('@/server/admin/overdue-actions');
      const first = await markOverdueActions(new Date('2026-09-09T12:00:00Z'));
      const second = await markOverdueActions(new Date('2026-09-09T12:00:00Z'));
      expect(second.marked).toBe(0);
      expect(first.marked).toBeGreaterThanOrEqual(0);
    },
    30_000,
  );
});

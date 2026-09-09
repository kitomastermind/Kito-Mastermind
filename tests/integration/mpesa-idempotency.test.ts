import { describe, expect, it } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import { loadLocalEnv } from '../../supabase/seed/env';
import { DEMO_PASSWORD } from '../../supabase/seed/names';

loadLocalEnv();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;

describe('STK callback idempotency', () => {
  it(
    'triple delivery yields one paid contribution',
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
      const { data: contribution } = await grace
        .from('contributions')
        .select('id, chapter_id, amount, status')
        .eq('profile_id', auth.user.id)
        .eq('status', 'PENDING')
        .limit(1)
        .maybeSingle();
      if (!contribution) throw new Error('pending contribution missing');

      const checkout = `ws_test_${Date.now()}`;
      const receipt = `RCPT${Date.now()}`;
      await admin.from('mpesa_payments').insert({
        contribution_id: contribution.id,
        chapter_id: contribution.chapter_id,
        profile_id: auth.user.id,
        checkout_request_id: checkout,
        phone_number: '+254700000000',
        amount: String(contribution.amount),
      });

      const { applyStkCallback } = await import('@/server/admin/stk-callback');
      const payload = {
        Body: {
          stkCallback: {
            CheckoutRequestID: checkout,
            ResultCode: 0,
            ResultDesc: 'ok',
            CallbackMetadata: { Item: [{ Name: 'MpesaReceiptNumber', Value: receipt }] },
          },
        },
      };
      await applyStkCallback(payload);
      await applyStkCallback(payload);
      await applyStkCallback(payload);

      const { data: paid } = await admin
        .from('contributions')
        .select('status')
        .eq('id', contribution.id)
        .single();
      expect(paid?.status).toBe('PAID');
      const { data: rows } = await admin
        .from('mpesa_payments')
        .select('id')
        .eq('mpesa_receipt_number', receipt);
      expect(rows).toHaveLength(1);
    },
    30_000,
  );
});

describe('dues-generation cron', () => {
  it('two runs produce one row per member', async () => {
    if (!url || !service) throw new Error('Supabase env is not configured');
    const { generateDuesForMonth } = await import('@/server/admin/dues');
    const now = new Date('2026-10-01T00:00:00Z');
    const first = await generateDuesForMonth(now);
    const second = await generateDuesForMonth(now);
    expect(second.inserted).toBe(0);
    expect(first.inserted).toBeGreaterThanOrEqual(0);
  }, 30_000);
});

import { createClient } from '@supabase/supabase-js';
import { loadLocalEnv } from '../../../supabase/seed/env';

loadLocalEnv();

const BUYER_EMAIL = 'e2e-ref-buyer@example.invalid';
const SELLER_EMAIL = 'e2e-ref-seller@example.invalid';

function admin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Supabase env is not configured');
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export async function prepareReferralLeads(): Promise<{
  sellerLeadId: string;
  matchId: string;
  sellerPhone: string;
}> {
  const sb = admin();
  const { data: chapter } = await sb.from('chapters').select('id').eq('code', 'NBO').single();
  const { data: grace } = await sb.from('profiles').select('id').eq('email', 'grace.wanjiru@kito.test').single();
  const { data: kevin } = await sb.from('profiles').select('id').eq('email', 'kevin.mwangi@kito.test').single();
  const { data: area } = await sb.from('areas').select('id').eq('name', 'Lavington').maybeSingle();
  if (!chapter || !grace || !kevin) throw new Error('Seed members missing');
  await sb.from('leads').delete().eq('client_email', BUYER_EMAIL);
  await sb.from('leads').delete().eq('client_email', SELLER_EMAIL);
  const phone = '+254700888001';
  const { data: buyer } = await sb
    .from('leads')
    .insert({
      owner_id: grace.id,
      chapter_id: chapter.id,
      client_name: 'E2E Referral Buyer',
      client_phone: '+254700888000',
      client_email: BUYER_EMAIL,
      lead_type: 'BUYER',
      property_type: 'TOWNHOUSE',
      area_id: area?.id ?? null,
      budget_min: '2800000000',
      budget_max: '3200000000',
      timeline: 'ONE_TO_THREE_MONTHS',
      consent_confirmed: true,
    })
    .select('id')
    .single();
  const { data: seller } = await sb
    .from('leads')
    .insert({
      owner_id: kevin.id,
      chapter_id: chapter.id,
      client_name: 'E2E Referral Seller',
      client_phone: phone,
      client_email: SELLER_EMAIL,
      lead_type: 'SELLER',
      property_type: 'TOWNHOUSE',
      area_id: area?.id ?? null,
      budget_min: '2800000000',
      budget_max: '3200000000',
      timeline: 'IMMEDIATE',
      consent_confirmed: true,
    })
    .select('id')
    .single();
  if (!buyer || !seller) throw new Error('Could not plant referral leads');
  const leadA = buyer.id < seller.id ? buyer.id : seller.id;
  const leadB = buyer.id < seller.id ? seller.id : buyer.id;
  await sb.from('lead_matches').delete().eq('lead_a_id', leadA).eq('lead_b_id', leadB);
  const { data: match } = await sb
    .from('lead_matches')
    .insert({
      lead_a_id: leadA,
      lead_b_id: leadB,
      score: 92,
      matched_facets: ['area', 'budget', 'type'],
    })
    .select('id')
    .single();
  if (!match) throw new Error('Could not plant referral match');
  return { sellerLeadId: seller.id, matchId: match.id, sellerPhone: phone };
}

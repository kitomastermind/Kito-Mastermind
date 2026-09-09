import { createHash, randomBytes } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { loadLocalEnv } from '../../../supabase/seed/env';

loadLocalEnv();

export const SENTINEL_NAME = 'ZZQX-SENTINEL-NAME';
export const SENTINEL_PHONE = '+254700000ZZQ';
export const SENTINEL_EMAIL = 'zzqx-sentinel@example.invalid';
export const SENTINEL_NOTE = 'ZZQX-SENTINEL-NOTE';
export const LEAK_PASSWORD = 'Kito-Leak-2026!';

export const LEAK_USERS = {
  owner: { email: 'leak-owner@kito.test', role: 'MEMBER' as const, name: 'Leak Owner' },
  grantee: { email: 'leak-grantee@kito.test', role: 'MEMBER' as const, name: 'Leak Grantee' },
  stranger: { email: 'leak-stranger@kito.test', role: 'MEMBER' as const, name: 'Leak Stranger' },
  treasurer: { email: 'leak-treasurer@kito.test', role: 'TREASURER' as const, name: 'Leak Treasurer' },
  chapterLead: { email: 'leak-lead@kito.test', role: 'CHAPTER_LEAD' as const, name: 'Leak Lead' },
  admin: { email: 'leak-admin@kito.test', role: 'ADMIN' as const, name: 'Leak Admin' },
};

export const CRAWL_PATHS = [
  '/dashboard',
  '/leads',
  '/leads/new',
  '/accountability',
  '/forum',
  '/reports',
  '/points',
  '/notifications',
  '/settings',
  '/admin',
  '/admin/members',
  '/admin/chapters',
  '/admin/cycles',
  '/admin/sessions',
  '/admin/topics',
  '/admin/pairings',
  '/admin/payments',
  '/admin/audit',
];

function admin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Supabase env is not configured');
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export async function prepareLeakFixture(): Promise<{ leadId: string; matchId: string | null }> {
  const sb = admin();
  const { data: chapter, error: chapterError } = await sb
    .from('chapters')
    .select('id')
    .eq('code', 'NBO')
    .single();
  if (chapterError || !chapter) throw chapterError ?? new Error('Nairobi chapter missing');
  const { data: inviter, error: inviterError } = await sb
    .from('profiles')
    .select('id')
    .eq('email', 'james.gitonga@kito.test')
    .single();
  if (inviterError || !inviter) throw inviterError ?? new Error('Admin seed user missing');

  for (const user of Object.values(LEAK_USERS)) {
    await ensureUser(sb, user, chapter.id, inviter.id);
  }

  const { data: profiles } = await sb
    .from('profiles')
    .select('id, email')
    .in('email', Object.values(LEAK_USERS).map((u) => u.email));
  const idOf = (email: string): string => {
    const row = profiles?.find((p) => p.email === email);
    if (!row) throw new Error(`Missing profile ${email}`);
    return row.id;
  };
  const ownerId = idOf(LEAK_USERS.owner.email);
  const granteeId = idOf(LEAK_USERS.grantee.email);

  await sb.from('leads').delete().eq('client_email', SENTINEL_EMAIL);
  const { data: area } = await sb.from('areas').select('id').eq('name', 'Lavington').maybeSingle();
  const { data: lead, error: leadError } = await sb
    .from('leads')
    .insert({
      owner_id: ownerId,
      chapter_id: chapter.id,
      client_name: SENTINEL_NAME,
      client_phone: SENTINEL_PHONE,
      client_email: SENTINEL_EMAIL,
      notes: SENTINEL_NOTE,
      lead_type: 'BUYER',
      property_type: 'TOWNHOUSE',
      area_id: area?.id ?? null,
      area_free_text: area ? null : 'Lavington',
      budget_min: '2800000000',
      budget_max: '3200000000',
      timeline: 'ONE_TO_THREE_MONTHS',
      consent_confirmed: true,
    })
    .select('id')
    .single();
  if (leadError || !lead) throw leadError ?? new Error('Failed to plant sentinel lead');

  await sb.from('lead_contact_grants').delete().eq('lead_id', lead.id);
  const { error: grantError } = await sb.from('lead_contact_grants').insert({
    lead_id: lead.id,
    grantee_id: granteeId,
    grantor_id: ownerId,
  });
  if (grantError) throw grantError;

  const otherEmail = 'zzqx-other@example.invalid';
  await sb.from('leads').delete().eq('client_email', otherEmail);
  const { data: otherLead, error: otherError } = await sb
    .from('leads')
    .insert({
      owner_id: idOf(LEAK_USERS.stranger.email),
      chapter_id: chapter.id,
      client_name: 'Other Client',
      client_phone: '+254711111111',
      client_email: otherEmail,
      notes: 'other notes',
      lead_type: 'SELLER',
      property_type: 'TOWNHOUSE',
      area_id: area?.id ?? null,
      area_free_text: area ? null : 'Lavington',
      budget_min: '2800000000',
      budget_max: '3200000000',
      timeline: 'IMMEDIATE',
      consent_confirmed: true,
    })
    .select('id')
    .single();
  if (otherError || !otherLead) throw otherError ?? new Error('Failed to plant complement lead');
  const leadA = lead.id < otherLead.id ? lead.id : otherLead.id;
  const leadB = lead.id < otherLead.id ? otherLead.id : lead.id;
  await sb.from('lead_matches').delete().eq('lead_a_id', leadA).eq('lead_b_id', leadB);
  const { data: match, error: matchError } = await sb
    .from('lead_matches')
    .insert({
      lead_a_id: leadA,
      lead_b_id: leadB,
      score: 90,
      matched_facets: [],
    })
    .select('id')
    .single();
  if (matchError || !match) throw matchError ?? new Error('Failed to plant match');

  return { leadId: lead.id, matchId: match.id };
}

export async function revokeLeakGrant(leadId: string): Promise<void> {
  const sb = admin();
  const { error } = await sb
    .from('lead_contact_grants')
    .update({ revoked_at: new Date().toISOString(), revoked_reason: 'leak-test' })
    .eq('lead_id', leadId)
    .is('revoked_at', null);
  if (error) throw error;
}

async function ensureUser(
  sb: ReturnType<typeof admin>,
  user: { email: string; role: 'MEMBER' | 'TREASURER' | 'CHAPTER_LEAD' | 'ADMIN'; name: string },
  chapterId: string,
  invitedBy: string,
): Promise<void> {
  const { data: existing } = await sb.from('profiles').select('id').eq('email', user.email).maybeSingle();
  if (existing) {
    await sb.from('profiles').update({ role: user.role, active: true, chapter_id: chapterId }).eq('id', existing.id);
    await sb.auth.admin.updateUserById(existing.id, { password: LEAK_PASSWORD });
    await sb.from('login_attempts').delete().eq('email', user.email);
    return;
  }
  const token = randomBytes(24).toString('hex');
  const tokenHash = createHash('sha256').update(token).digest('hex');
  const { error: inviteError } = await sb.from('invitations').insert({
    email: user.email,
    chapter_id: chapterId,
    role: user.role,
    token_hash: tokenHash,
    invited_by: invitedBy,
    expires_at: new Date(Date.now() + 86400000).toISOString(),
  });
  if (inviteError) throw inviteError;
  const { error: createError } = await sb.auth.admin.createUser({
    email: user.email,
    password: LEAK_PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: user.name },
  });
  if (createError) throw createError;
  await sb.from('profiles').update({ role: user.role, full_name: user.name }).eq('email', user.email);
}

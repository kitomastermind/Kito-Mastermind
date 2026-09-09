import { supabaseAdmin } from '@/server/admin/client';

export async function exportMemberRecord(profileId: string): Promise<Record<string, unknown>> {
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('id, full_name, email, role, chapter_id, created_at')
    .eq('id', profileId)
    .single();
  const { data: contributions } = await supabaseAdmin
    .from('contributions')
    .select('id, amount, paid_on, status, kind')
    .eq('profile_id', profileId);
  const { data: points } = await supabaseAdmin
    .from('points_entries')
    .select('id, category, points, reason, created_at')
    .eq('profile_id', profileId);
  return {
    profile,
    contributions,
    points,
    exportedAt: new Date().toISOString(),
  };
}

export async function eraseMemberContact(profileId: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from('profiles')
    .update({ phone: null, brokerage: null, full_name: 'Removed member' })
    .eq('id', profileId);
  if (error) throw error;
}

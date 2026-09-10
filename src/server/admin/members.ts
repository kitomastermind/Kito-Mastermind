import { createHash, randomBytes } from 'node:crypto';
import { siteOrigin } from '@/lib/seo';
import { supabaseAdmin } from '@/server/admin/client';
import { sendInviteEmail } from '@/server/email/invite';

export async function deactivateMember(profileId: string): Promise<void> {
  const now = new Date().toISOString();
  const { error } = await supabaseAdmin.from('profiles').update({ active: false }).eq('id', profileId);
  if (error) throw error;
  const { error: grantError } = await supabaseAdmin
    .from('lead_contact_grants')
    .update({ revoked_at: now })
    .eq('grantee_id', profileId)
    .is('revoked_at', null);
  if (grantError) throw grantError;
  await supabaseAdmin.auth.admin.signOut(profileId, 'global');
}

export async function changeMemberRole(
  profileId: string,
  role: 'MEMBER' | 'TREASURER' | 'CHAPTER_LEAD' | 'ADMIN',
): Promise<void> {
  const { error } = await supabaseAdmin.from('profiles').update({ role }).eq('id', profileId);
  if (error) throw error;
}

export async function resendInvitation(invitationId: string): Promise<{ inviteUrl?: string }> {
  const token = randomBytes(32).toString('hex');
  const tokenHash = createHash('sha256').update(token).digest('hex');
  const expires = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabaseAdmin
    .from('invitations')
    .update({ token_hash: tokenHash, expires_at: expires, revoked_at: null })
    .eq('id', invitationId)
    .is('accepted_at', null)
    .select('id, email')
    .single();
  if (error || !data) throw error ?? new Error('Invitation not found');
  const inviteUrl = `${siteOrigin()}/invite/${token}`;
  await sendInviteEmail(data.email, inviteUrl);
  return process.env.NODE_ENV === 'production' ? {} : { inviteUrl };
}

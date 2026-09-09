import { supabaseAdmin } from '@/server/admin/client';
import type { Database } from '@/lib/types/database';

export type InvitationRow = Database['public']['Tables']['invitations']['Row'] & {
  chapters: { name: string; code: string } | null;
};

export async function insertInvitation(input: {
  email: string;
  chapterId: string;
  role: Database['public']['Enums']['app_role'];
  tokenHash: string;
  invitedBy: string;
  expiresAt: string;
}): Promise<{ id: string }> {
  const { data, error } = await supabaseAdmin
    .from('invitations')
    .insert({
      email: input.email,
      chapter_id: input.chapterId,
      role: input.role,
      token_hash: input.tokenHash,
      invited_by: input.invitedBy,
      expires_at: input.expiresAt,
    })
    .select('id')
    .single();
  if (error || !data) {
    throw new Error(error?.message ?? 'Could not create the invitation.');
  }
  return { id: data.id };
}

export async function findInvitationByHash(
  tokenHash: string,
): Promise<InvitationRow | null> {
  const { data, error } = await supabaseAdmin
    .from('invitations')
    .select('*, chapters(name, code)')
    .eq('token_hash', tokenHash)
    .maybeSingle();
  if (error) {
    throw error;
  }
  return data as InvitationRow | null;
}

export async function completeInvitationProfile(input: {
  profileId: string;
  fullName: string;
  phone: string;
  brokerage: string;
}): Promise<void> {
  const { error } = await supabaseAdmin
    .from('profiles')
    .update({
      full_name: input.fullName,
      phone: input.phone,
      brokerage: input.brokerage,
      agreement_version: '2026-01',
      agreement_accepted_at: new Date().toISOString(),
    })
    .eq('id', input.profileId);
  if (error) {
    throw error;
  }
}

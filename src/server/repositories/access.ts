import { createClient } from '@/server/supabase/server';

export type AccessGrantView = {
  id: string;
  granteeId: string;
  granteeName: string;
  grantedAt: string;
  lastViewedAt: string | null;
  revokedAt: string | null;
};

export type AccessRequestView = {
  id: string;
  requesterId: string;
  requesterName: string;
  status: 'PENDING' | 'APPROVED' | 'DENIED' | 'EXPIRED' | 'REVOKED';
  message: string | null;
  requestedAt: string;
  respondedAt: string | null;
};

export async function listAccessPanel(leadId: string): Promise<{
  grants: AccessGrantView[];
  requests: AccessRequestView[];
}> {
  const supabase = await createClient();
  const [{ data: grants, error: grantError }, { data: requests, error: requestError }] =
    await Promise.all([
      supabase.from('lead_contact_grants').select('*').eq('lead_id', leadId),
      supabase.from('contact_access_requests').select('*').eq('lead_id', leadId),
    ]);
  if (grantError) throw grantError;
  if (requestError) throw requestError;

  const ids = [
    ...(grants ?? []).map((row) => row.grantee_id),
    ...(requests ?? []).map((row) => row.requester_id),
  ];
  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('id, full_name')
    .in('id', ids.length ? ids : ['00000000-0000-0000-0000-000000000000']);
  if (profileError) throw profileError;
  const nameOf = (id: string): string =>
    profiles?.find((row) => row.id === id)?.full_name ?? 'Member';

  return {
    grants: (grants ?? []).map((row) => ({
      id: row.id,
      granteeId: row.grantee_id,
      granteeName: nameOf(row.grantee_id),
      grantedAt: row.granted_at,
      lastViewedAt: row.last_viewed_at,
      revokedAt: row.revoked_at,
    })),
    requests: (requests ?? []).map((row) => ({
      id: row.id,
      requesterId: row.requester_id,
      requesterName: nameOf(row.requester_id),
      status: row.status,
      message: row.message,
      requestedAt: row.requested_at,
      respondedAt: row.responded_at,
    })),
  };
}

import { supabaseAdmin } from '@/server/admin/client';

export async function expirePendingRequests(): Promise<number> {
  const { data, error } = await supabaseAdmin.rpc('expire_pending_access_requests');
  if (error) throw error;
  return data ?? 0;
}

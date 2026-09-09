import type { Database, Json } from '@/lib/types/database';
import { createClient } from '@/server/supabase/server';

export type AuditAction = Database['public']['Enums']['audit_action'];

export async function writeAudit(input: {
  actorId: string | null;
  action: AuditAction;
  subjectType: string;
  subjectId: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.rpc('write_audit', {
    p_action: input.action,
    p_subject_type: input.subjectType,
    p_subject_id: input.subjectId,
    p_metadata: (input.metadata ?? {}) as Json,
  });
  if (error) {
    throw error;
  }
}

import { supabaseAdmin } from '@/server/admin/client';
import type { Database } from '@/lib/types/database';
import { canViewAuditEntry, type Actor } from '@/server/policy';

export type AuditRow = {
  id: number;
  action: string;
  actorName: string;
  subjectType: string;
  subjectId: string | null;
  occurredAt: string;
  metadata: Record<string, unknown>;
};

export async function listAuditEntries(
  actor: Actor,
  filters: { action?: string; subjectType?: string },
): Promise<AuditRow[]> {
  let query = supabaseAdmin
    .from('audit_log')
    .select('id, action, actor_id, subject_type, subject_id, occurred_at, metadata')
    .order('occurred_at', { ascending: false })
    .limit(80);
  if (filters.action) {
    query = query.eq('action', filters.action as Database['public']['Enums']['audit_action']);
  }
  if (filters.subjectType) query = query.eq('subject_type', filters.subjectType);
  const { data, error } = await query;
  if (error) throw error;
  const actorIds = [...new Set((data ?? []).map((row) => row.actor_id).filter(Boolean))] as string[];
  const { data: profiles } = actorIds.length
    ? await supabaseAdmin.from('profiles').select('id, full_name, chapter_id').in('id', actorIds)
    : { data: [] as { id: string; full_name: string; chapter_id: string }[] };
  return (data ?? []).flatMap((row) => {
    const profile = profiles?.find((item) => item.id === row.actor_id);
    const allowed = canViewAuditEntry(actor, {
      actorId: row.actor_id,
      chapterId: profile?.chapter_id ?? null,
    });
    if (!allowed.allow) return [];
    const metadata = (row.metadata ?? {}) as Record<string, unknown>;
    return [
      {
        id: row.id,
        action: row.action,
        actorName: profile?.full_name ?? 'System',
        subjectType: row.subject_type,
        subjectId: row.subject_id,
        occurredAt: row.occurred_at,
        metadata: {
          ...metadata,
          client_name: undefined,
          client_phone: undefined,
          client_email: undefined,
          notes: undefined,
        },
      },
    ];
  });
}

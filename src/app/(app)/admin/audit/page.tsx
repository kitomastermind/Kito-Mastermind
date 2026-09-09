import { redirect } from 'next/navigation';
import { PageHeader } from '@/components/kito/PageHeader';
import { listAuditEntries } from '@/server/admin/audit-list';
import { canViewAuditLog } from '@/server/policy';
import { requireActor } from '@/server/supabase/server';
import { formatNairobiDateTime } from '@/lib/format';
import { createClient } from '@/server/supabase/server';
import { DataSubjectTools } from './tools';

export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<{ action?: string; subject?: string }>;
}) {
  const actor = await requireActor();
  if (!canViewAuditLog(actor).allow) redirect('/dashboard');
  if (actor.role !== 'ADMIN' && actor.role !== 'CHAPTER_LEAD') redirect('/dashboard');
  const params = await searchParams;
  const [rows, supabase] = await Promise.all([
    listAuditEntries(actor, { action: params.action, subjectType: params.subject }),
    createClient(),
  ]);
  const { data: members } = await supabase.from('profiles').select('id, full_name').order('full_name');
  return (
    <>
      <PageHeader eyebrow="Administration" title="Audit log" />
      <DataSubjectTools members={(members ?? []).map((row) => ({ id: row.id, name: row.full_name }))} />
      <p className="mb-4 text-sm text-muted">
        Contact views are recorded as an event. The contact itself is never stored here.
      </p>
      <form className="mb-4 flex flex-wrap gap-2">
        <input name="action" defaultValue={params.action} placeholder="Action" className="h-11 rounded-[4px] border border-line bg-cream px-3 text-sm" />
        <input name="subject" defaultValue={params.subject} placeholder="Subject type" className="h-11 rounded-[4px] border border-line bg-cream px-3 text-sm" />
        <button type="submit" className="h-11 rounded-[4px] bg-secondary px-4 text-sm font-semibold text-primary-deep">Filter</button>
      </form>
      <ul className="divide-y divide-line rounded-[6px] border border-line">
        {rows.map((row) => (
          <li key={row.id} className="px-4 py-3 text-sm">
            <p className="font-semibold">{row.action}</p>
            <p className="text-xs text-muted">
              {row.actorName} · {row.subjectType} · {formatNairobiDateTime(row.occurredAt)}
            </p>
          </li>
        ))}
      </ul>
    </>
  );
}

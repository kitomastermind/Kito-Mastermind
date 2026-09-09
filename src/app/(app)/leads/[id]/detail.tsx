'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { LeadView } from '@/server/dto/lead';
import type { AccessGrantView, AccessRequestView } from '@/server/repositories/access';
import { approveAccessAction, declineAccessAction, revokeGrantAction } from '@/server/actions/access';
import { deleteLeadAction, updateLeadAction } from '@/server/actions/leads';
import { ConfirmDialog } from '@/components/kito/interactive';
import { MoneyText } from '@/components/kito/MatchCard';
import { formatNairobiDate } from '@/lib/format';

export function LeadDetail({
  lead,
  isOwner,
  panel,
}: {
  lead: LeadView;
  isOwner: boolean;
  panel: { grants: AccessGrantView[]; requests: AccessRequestView[] } | null;
}) {
  const router = useRouter();
  const [revokeId, setRevokeId] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [notice, setNotice] = useState('');

  return (
    <div className="space-y-6">
      <section className="rounded-[6px] border border-line bg-cream-flat p-4">
        {lead.contactVisible ? (
          <dl className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div><dt className="text-xs uppercase text-muted">Phone</dt><dd>{lead.clientPhone}</dd></div>
            <div><dt className="text-xs uppercase text-muted">Email</dt><dd>{lead.clientEmail ?? '—'}</dd></div>
            <div className="md:col-span-2"><dt className="text-xs uppercase text-muted">Notes</dt><dd>{lead.notes ?? '—'}</dd></div>
          </dl>
        ) : (
          <p className="text-sm text-muted">Contact details are hidden.</p>
        )}
        <p className="mt-3 text-sm">{lead.leadType} · {lead.areaLabel} · {lead.propertyType ?? 'Property unset'}</p>
        {lead.budgetMinCents ? <MoneyText cents={lead.budgetMinCents} /> : null}
      </section>
      {isOwner ? (
        <form
          className="flex flex-wrap gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            const status = new FormData(event.currentTarget).get('status');
            void updateLeadAction({ leadId: lead.id, status }).then((result) => {
              setNotice(result.ok ? 'Status updated.' : result.error);
              router.refresh();
            });
          }}
        >
          <select name="status" defaultValue={lead.status} className="h-11 rounded-[4px] border border-line bg-cream-flat px-3">
            <option value="NEW">New</option>
            <option value="CONTACTED">Contacted</option>
            <option value="QUALIFIED">Qualified</option>
            <option value="UNDER_CONTRACT">Under contract</option>
            <option value="CLOSED">Closed</option>
            <option value="LOST">Lost</option>
          </select>
          <button type="submit" className="h-11 rounded-[4px] bg-secondary px-4 font-semibold text-primary-deep">Update status</button>
          <button type="button" className="h-11 rounded-[4px] border border-line px-4" onClick={() => setDeleteOpen(true)}>Delete</button>
        </form>
      ) : null}
      <p className="min-h-4 text-sm text-muted" aria-live="polite">{notice}</p>
      {isOwner && panel ? (
        <section className="space-y-4">
          <h2 className="font-display text-xl text-primary">Access</h2>
          {panel.grants.filter((g) => !g.revokedAt).map((grant) => (
            <div key={grant.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-line py-3">
              <p>
                {grant.granteeName} · granted {formatNairobiDate(grant.grantedAt)}
                {grant.lastViewedAt ? ` · last viewed ${formatNairobiDate(grant.lastViewedAt)}` : ''}
              </p>
              <button type="button" className="h-11 rounded-[4px] bg-danger-pale px-3 text-danger-ink" onClick={() => setRevokeId(grant.id)}>Revoke</button>
            </div>
          ))}
          {panel.requests.filter((r) => r.status === 'PENDING').map((request) => (
            <div key={request.id} className="space-y-2 border-b border-line py-3">
              <p>{request.requesterName} asked {formatNairobiDate(request.requestedAt)}</p>
              {request.message ? <p className="text-sm text-muted">{request.message}</p> : null}
              <div className="flex gap-2">
                <button type="button" className="h-11 rounded-[4px] bg-secondary px-3 font-semibold text-primary-deep" onClick={() => void approveAccessAction({ requestId: request.id }).then(() => router.refresh())}>Approve</button>
                <button type="button" className="h-11 rounded-[4px] border border-line px-3" onClick={() => void declineAccessAction({ requestId: request.id }).then(() => router.refresh())}>Decline</button>
              </div>
            </div>
          ))}
          {panel.requests.filter((r) => r.status === 'DENIED' || r.status === 'EXPIRED').map((request) => (
            <p key={request.id} className="text-sm text-muted">
              {request.requesterName} · {request.status.toLowerCase()} {formatNairobiDate(request.requestedAt)}
            </p>
          ))}
          {panel.grants.filter((g) => g.revokedAt).map((grant) => (
            <p key={grant.id} className="text-sm text-muted">
              Revoked from {grant.granteeName} on {formatNairobiDate(grant.revokedAt ?? grant.grantedAt)}
            </p>
          ))}
        </section>
      ) : null}
      <ConfirmDialog
        open={revokeId !== null}
        title="Revoke access"
        body="They will lose contact details on their next request."
        confirmLabel="Revoke"
        destructive
        onClose={() => setRevokeId(null)}
        onConfirm={() => {
          if (!revokeId) return;
          void revokeGrantAction({ grantId: revokeId }).then(() => {
            setRevokeId(null);
            router.refresh();
          });
        }}
      />
      <ConfirmDialog
        open={deleteOpen}
        title="Delete this lead"
        body="This removes the lead from your board."
        confirmLabel="Delete"
        destructive
        onClose={() => setDeleteOpen(false)}
        onConfirm={() => {
          void deleteLeadAction({ leadId: lead.id }).then((result) => {
            if (result.ok) router.push('/leads');
            else setNotice(result.error);
          });
        }}
      />
    </div>
  );
}

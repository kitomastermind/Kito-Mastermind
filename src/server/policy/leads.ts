import type { Actor, Decision } from '@/server/policy/types';
import { allow, deny } from '@/server/policy/types';

export type LeadSubject = { id: string; ownerId: string; chapterId: string };

export type GrantRow = {
  leadId: string;
  granteeId: string;
  revokedAt: string | null;
  expiresAt: string | null;
};

export type AccessRequestRow = {
  leadId: string;
  requesterId: string;
  ownerId: string;
  status: 'PENDING' | 'APPROVED' | 'DENIED' | 'EXPIRED' | 'REVOKED';
};

export function canViewLeadContact(
  actor: Actor,
  lead: { id: string; ownerId: string },
  grants: ReadonlyArray<GrantRow>,
  now: Date,
): Decision {
  // Note the absence of an admin branch. It is deliberate and permanent.
  if (!actor.active) return deny('Account is not active');
  if (lead.ownerId === actor.id) return allow;
  const g = grants.find(
    (x) =>
      x.leadId === lead.id &&
      x.granteeId === actor.id &&
      x.revokedAt === null &&
      (x.expiresAt === null || new Date(x.expiresAt) > now),
  );
  return g ? allow : deny('No active contact grant for this lead');
}

export function canViewRedactedLead(actor: Actor, leadChapterId: string): Decision {
  if (!actor.active) return deny('Account is not active');
  if (actor.chapterId !== leadChapterId) {
    return deny('Lead is not in your chapter');
  }
  return allow;
}

export function canEditLead(actor: Actor, lead: LeadSubject): Decision {
  if (!actor.active) return deny('Account is not active');
  if (lead.ownerId !== actor.id) return deny('Only the owning agent can edit this lead');
  return allow;
}

export function canDeleteLead(actor: Actor, lead: LeadSubject): Decision {
  return canEditLead(actor, lead);
}

export function canRequestContactAccess(
  actor: Actor,
  lead: LeadSubject,
  existingRequests: ReadonlyArray<AccessRequestRow>,
): Decision {
  if (!actor.active) return deny('Account is not active');
  if (lead.ownerId === actor.id) {
    return deny('You already own this lead');
  }
  if (actor.chapterId !== lead.chapterId) {
    return deny('Lead is not in your chapter');
  }
  const open = existingRequests.find(
    (row) =>
      row.leadId === lead.id &&
      row.requesterId === actor.id &&
      row.status === 'PENDING',
  );
  if (open) return deny('You already have an open request for this lead');
  return allow;
}

export function canRespondToRequest(
  actor: Actor,
  request: { ownerId: string; status: AccessRequestRow['status'] },
): Decision {
  if (!actor.active) return deny('Account is not active');
  if (request.ownerId !== actor.id) {
    return deny('Only the owning agent can respond');
  }
  if (request.status !== 'PENDING') {
    return deny('This request is no longer pending');
  }
  return allow;
}

export function canRevokeGrant(
  actor: Actor,
  grant: { grantorId: string; revokedAt: string | null },
): Decision {
  if (!actor.active) return deny('Account is not active');
  if (grant.grantorId !== actor.id) {
    return deny('Only the grantor can revoke access');
  }
  if (grant.revokedAt !== null) {
    return deny('This grant has already been revoked');
  }
  return allow;
}

export function canReadThread(
  actor: Actor,
  leadA: { ownerId: string },
  leadB: { ownerId: string },
): Decision {
  if (!actor.active) return deny('Account is not active');
  if (actor.id === leadA.ownerId || actor.id === leadB.ownerId) return allow;
  return deny('Only the two matched agents can read this thread');
}

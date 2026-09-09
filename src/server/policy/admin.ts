import type { Actor, Decision } from '@/server/policy/types';
import { allow, deny } from '@/server/policy/types';

const RANK: Record<Actor['role'], number> = {
  MEMBER: 0,
  TREASURER: 1,
  CHAPTER_LEAD: 2,
  ADMIN: 3,
};

export function canInviteMember(
  actor: Actor,
  chapterId: string,
  targetRole: Actor['role'],
): Decision {
  if (!actor.active) return deny('Account is not active');
  if (actor.role === 'ADMIN') return allow;
  if (
    actor.role === 'CHAPTER_LEAD' &&
    actor.chapterId === chapterId &&
    (targetRole === 'MEMBER' || targetRole === 'TREASURER')
  ) {
    return allow;
  }
  return deny('You cannot invite a member with that role to this chapter');
}

export function canChangeRole(
  actor: Actor,
  target: { id: string; chapterId: string; role: Actor['role'] },
  newRole: Actor['role'],
): Decision {
  if (!actor.active) return deny('Account is not active');
  if (target.id === actor.id) return deny('You cannot change your own role');
  if (actor.role === 'ADMIN') return allow;
  if (
    actor.role === 'CHAPTER_LEAD' &&
    actor.chapterId === target.chapterId &&
    RANK[newRole] <= RANK.TREASURER &&
    RANK[target.role] <= RANK.TREASURER
  ) {
    return allow;
  }
  return deny('You cannot change this member’s role');
}

export function canDeactivateMember(
  actor: Actor,
  target: { id: string; chapterId: string },
): Decision {
  if (!actor.active) return deny('Account is not active');
  if (target.id === actor.id) return deny('You cannot deactivate yourself');
  if (actor.role === 'ADMIN') return allow;
  if (actor.role === 'CHAPTER_LEAD' && actor.chapterId === target.chapterId) {
    return allow;
  }
  return deny('You cannot deactivate this member');
}

export function canManageChapters(actor: Actor): Decision {
  if (!actor.active) return deny('Account is not active');
  if (actor.role === 'ADMIN') return allow;
  return deny('Only an admin can manage chapters');
}

export function canViewAuditLog(actor: Actor): Decision {
  if (!actor.active) return deny('Account is not active');
  return allow;
}

export function canViewAuditEntry(
  actor: Actor,
  entry: { actorId: string | null; chapterId: string | null },
): Decision {
  if (!actor.active) return deny('Account is not active');
  if (entry.actorId === actor.id) return allow;
  if (actor.role === 'ADMIN') return allow;
  if (
    actor.role === 'CHAPTER_LEAD' &&
    entry.chapterId !== null &&
    actor.chapterId === entry.chapterId
  ) {
    return allow;
  }
  return deny('You cannot view this audit entry');
}

export function canCreateSession(actor: Actor, chapterId: string): Decision {
  if (!actor.active) return deny('Account is not active');
  if (actor.role === 'ADMIN') return allow;
  if (actor.role === 'CHAPTER_LEAD' && actor.chapterId === chapterId) return allow;
  return deny('Only a chapter lead or admin can create a session');
}

export function canAssignPairings(actor: Actor, chapterId: string): Decision {
  return canCreateSession(actor, chapterId);
}

export function canLogClosedBusiness(
  actor: Actor,
  participantIds: ReadonlyArray<string>,
): Decision {
  if (!actor.active) return deny('Account is not active');
  if (participantIds.includes(actor.id)) return allow;
  return deny('Only a participant can log closed business');
}

export function canVerifyClosedBusiness(actor: Actor, chapterId: string): Decision {
  if (!actor.active) return deny('Account is not active');
  if (actor.role === 'ADMIN') return allow;
  if (actor.role === 'CHAPTER_LEAD' && actor.chapterId === chapterId) return allow;
  return deny('Only a chapter lead or admin can verify a deal');
}

export function canViewCrmTokens(actor: Actor): Decision {
  void actor;
  return deny('CRM access tokens are never returned to any client');
}

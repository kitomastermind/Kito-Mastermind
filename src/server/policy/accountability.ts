import type { Actor, Decision } from '@/server/policy/types';
import { allow, deny } from '@/server/policy/types';

export type ActionSubject = {
  ownerId: string;
  partnerId: string | null;
  chapterId: string;
  status: string;
  nudgedAt: string | null;
};

export type PairingSubject = {
  profileA: string;
  profileB: string;
  endedAt: string | null;
};

export function canViewAction(actor: Actor, action: ActionSubject): Decision {
  if (!actor.active) return deny('Account is not active');
  if (action.ownerId === actor.id || action.partnerId === actor.id) return allow;
  if (actor.role === 'ADMIN') return allow;
  if (actor.role === 'CHAPTER_LEAD' && actor.chapterId === action.chapterId) {
    return allow;
  }
  return deny('You cannot view this action');
}

export function canCreateAction(
  actor: Actor,
  ownerId: string,
  activePairing: PairingSubject | null,
): Decision {
  if (!actor.active) return deny('Account is not active');
  if (ownerId === actor.id) return allow;
  if (
    activePairing &&
    activePairing.endedAt === null &&
    ((activePairing.profileA === actor.id && activePairing.profileB === ownerId) ||
      (activePairing.profileB === actor.id && activePairing.profileA === ownerId))
  ) {
    return allow;
  }
  return deny('You can only create actions for yourself or your partner');
}

export function canCompleteAction(actor: Actor, action: ActionSubject): Decision {
  if (!actor.active) return deny('Account is not active');
  if (action.ownerId !== actor.id) {
    return deny('Only the owner can complete this action');
  }
  if (action.status === 'VERIFIED') {
    return deny('A verified action cannot be changed');
  }
  return allow;
}

export function canVerifyAction(actor: Actor, action: ActionSubject): Decision {
  if (!actor.active) return deny('Account is not active');
  if (actor.id === action.ownerId) {
    return deny('An action owner cannot verify their own action');
  }
  if (action.partnerId === actor.id) return allow;
  if (actor.role === 'ADMIN') return allow;
  if (actor.role === 'CHAPTER_LEAD' && actor.chapterId === action.chapterId) {
    return allow;
  }
  return deny('Only a partner or chapter lead can verify this action');
}

export function canNudge(actor: Actor, action: ActionSubject, now: Date): Decision {
  if (!actor.active) return deny('Account is not active');
  if (action.nudgedAt) {
    const elapsed = now.getTime() - new Date(action.nudgedAt).getTime();
    if (elapsed < 24 * 60 * 60 * 1000) {
      return deny('This action was already nudged in the last 24 hours');
    }
  }
  if (action.partnerId === actor.id) return allow;
  if (actor.role === 'ADMIN') return allow;
  if (actor.role === 'CHAPTER_LEAD' && actor.chapterId === action.chapterId) {
    return allow;
  }
  return deny('Only a partner or chapter lead can nudge');
}

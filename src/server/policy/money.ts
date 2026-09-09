import type { Actor, Decision } from '@/server/policy/types';
import { allow, deny } from '@/server/policy/types';

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export type ContributionSubject = {
  profileId: string;
  chapterId: string;
  createdAt: string;
  voidedAt: string | null;
};

function isTreasurerOf(actor: Actor, chapterId: string): boolean {
  return actor.role === 'TREASURER' && actor.chapterId === chapterId;
}

export function canViewMemberContributions(
  actor: Actor,
  target: { profileId: string; chapterId: string },
): Decision {
  if (!actor.active) return deny('Account is not active');
  if (actor.id === target.profileId) return allow;
  if (actor.role === 'ADMIN') return allow;
  if (isTreasurerOf(actor, target.chapterId)) return allow;
  return deny('You cannot view another member’s contributions');
}

export function canRecordContribution(actor: Actor, chapterId: string): Decision {
  if (!actor.active) return deny('Account is not active');
  if (actor.role === 'ADMIN') return allow;
  if (isTreasurerOf(actor, chapterId)) return allow;
  return deny('Only a treasurer or admin can record a contribution');
}

export function canVoidContribution(
  actor: Actor,
  contribution: ContributionSubject,
  now: Date,
): Decision {
  if (!actor.active) return deny('Account is not active');
  if (contribution.voidedAt !== null) {
    return deny('This contribution is already voided');
  }
  if (actor.role === 'ADMIN') return allow;
  if (isTreasurerOf(actor, contribution.chapterId)) {
    const age = now.getTime() - new Date(contribution.createdAt).getTime();
    if (age > THIRTY_DAYS_MS) {
      return deny('Treasurers can only void within 30 days');
    }
    return allow;
  }
  return deny('You cannot void this contribution');
}

export function canGenerateStatement(
  actor: Actor,
  targetProfileId: string,
): Decision {
  if (!actor.active) return deny('Account is not active');
  if (actor.id !== targetProfileId) {
    return deny('Statements are only available for your own contributions');
  }
  return allow;
}

export function canViewChapterLedger(actor: Actor, chapterId: string): Decision {
  if (!actor.active) return deny('Account is not active');
  if (actor.role === 'ADMIN') return allow;
  if (actor.chapterId !== chapterId) return deny('Not your chapter');
  if (actor.role === 'TREASURER' || actor.role === 'CHAPTER_LEAD') return allow;
  return deny('Only a treasurer or chapter lead can view the chapter ledger');
}

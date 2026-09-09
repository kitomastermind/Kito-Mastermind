export type Actor = {
  id: string;
  chapterId: string;
  role: 'MEMBER' | 'TREASURER' | 'CHAPTER_LEAD' | 'ADMIN';
  active: boolean;
  fullName: string;
};

export type Decision = { allow: true } | { allow: false; reason: string };

export const deny = (reason: string): Decision => ({ allow: false, reason });
export const allow: Decision = { allow: true };

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

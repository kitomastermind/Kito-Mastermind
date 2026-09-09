import type { Actor, Decision } from '@/server/policy/types';
import { allow, deny } from '@/server/policy/types';

export type PostSubject = {
  id: string;
  authorId: string;
  chapterId: string | null;
};

export function canRatePost(
  actor: Actor,
  post: PostSubject,
  existingRating: { stars: number } | null,
): Decision {
  void existingRating;
  if (!actor.active) return deny('Account is not active');
  if (post.authorId === actor.id) {
    return deny('You cannot rate your own lesson');
  }
  return allow;
}

export function canHidePost(actor: Actor, post: PostSubject): Decision {
  if (!actor.active) return deny('Account is not active');
  if (actor.role === 'ADMIN') return allow;
  if (actor.role === 'CHAPTER_LEAD') {
    if (post.chapterId === null || post.chapterId === actor.chapterId) {
      return allow;
    }
  }
  return deny('Only a chapter lead or admin can hide a post');
}

export function canCreateTopic(actor: Actor, chapterId: string | null): Decision {
  if (!actor.active) return deny('Account is not active');
  if (actor.role === 'ADMIN') return allow;
  if (actor.role === 'CHAPTER_LEAD') {
    if (chapterId === null || chapterId === actor.chapterId) return allow;
  }
  return deny('Only a chapter lead or admin can create a topic');
}

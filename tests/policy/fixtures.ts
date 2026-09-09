import type { Actor } from '@/server/policy';

const CHAPTER_A = 'chapter-a';
const CHAPTER_B = 'chapter-b';

export function actor(overrides: Partial<Actor> & Pick<Actor, 'id' | 'role'>): Actor {
  return {
    chapterId: CHAPTER_A,
    active: true,
    fullName: overrides.fullName ?? overrides.role,
    ...overrides,
  };
}

export const member = actor({ id: 'member-a', role: 'MEMBER', fullName: 'Member A' });
export const memberB = actor({ id: 'member-b', role: 'MEMBER', fullName: 'Member B' });
export const otherChapter = actor({
  id: 'member-c',
  role: 'MEMBER',
  chapterId: CHAPTER_B,
  fullName: 'Other Chapter',
});
export const treasurer = actor({ id: 'treasurer-a', role: 'TREASURER', fullName: 'Treasurer' });
export const chapterLead = actor({
  id: 'lead-a',
  role: 'CHAPTER_LEAD',
  fullName: 'Chapter Lead',
});
export const admin = actor({ id: 'admin-a', role: 'ADMIN', fullName: 'Admin' });
export const inactive = actor({
  id: 'inactive-a',
  role: 'MEMBER',
  active: false,
  fullName: 'Inactive',
});

export { CHAPTER_A, CHAPTER_B };

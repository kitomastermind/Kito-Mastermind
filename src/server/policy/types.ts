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

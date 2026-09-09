import { describe, expect, it } from 'vitest';
import { canCreateTopic, canHidePost, canRatePost } from '@/server/policy';
import {
  admin,
  CHAPTER_A,
  CHAPTER_B,
  chapterLead,
  member,
  memberB,
} from './fixtures';

const post = { id: 'post-1', authorId: member.id, chapterId: CHAPTER_A };

describe('forum policy', () => {
  it('refuses rating your own post and allows any other active member', () => {
    expect(canRatePost(member, post, null).allow).toBe(false);
    expect(canRatePost(memberB, post, null)).toEqual({ allow: true });
    expect(canRatePost(memberB, post, { stars: 3 })).toEqual({ allow: true });
    expect(canRatePost(admin, post, null)).toEqual({ allow: true });
  });

  it('lets chapter lead and admin hide a post', () => {
    expect(canHidePost(chapterLead, post)).toEqual({ allow: true });
    expect(canHidePost(admin, post)).toEqual({ allow: true });
    expect(canHidePost(member, post).allow).toBe(false);
    expect(
      canHidePost({ ...chapterLead, chapterId: CHAPTER_B }, post).allow,
    ).toBe(false);
  });

  it('lets chapter lead and admin create a topic', () => {
    expect(canCreateTopic(chapterLead, CHAPTER_A)).toEqual({ allow: true });
    expect(canCreateTopic(admin, CHAPTER_A)).toEqual({ allow: true });
    expect(canCreateTopic(admin, null)).toEqual({ allow: true });
    expect(canCreateTopic(member, CHAPTER_A).allow).toBe(false);
    expect(canCreateTopic(chapterLead, CHAPTER_B).allow).toBe(false);
  });
});

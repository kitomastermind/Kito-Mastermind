import { describe, expect, it } from 'vitest';
import {
  canCompleteAction,
  canCreateAction,
  canNudge,
  canVerifyAction,
  canViewAction,
} from '@/server/policy';
import {
  admin,
  CHAPTER_A,
  CHAPTER_B,
  chapterLead,
  member,
  memberB,
  otherChapter,
  treasurer,
} from './fixtures';

const now = new Date('2026-07-01T12:00:00Z');
const pairing = {
  profileA: member.id,
  profileB: memberB.id,
  endedAt: null,
};
const action = {
  ownerId: member.id,
  partnerId: memberB.id,
  chapterId: CHAPTER_A,
  status: 'COMPLETED',
  nudgedAt: null,
};

describe('accountability policy', () => {
  it('lets owner, partner, chapter lead and admin view; not a stranger', () => {
    expect(canViewAction(member, action)).toEqual({ allow: true });
    expect(canViewAction(memberB, action)).toEqual({ allow: true });
    expect(canViewAction(chapterLead, action)).toEqual({ allow: true });
    expect(canViewAction(admin, action)).toEqual({ allow: true });
    expect(canViewAction(treasurer, action).allow).toBe(false);
    expect(canViewAction(otherChapter, action).allow).toBe(false);
  });

  it('lets a member create for self or their partner', () => {
    expect(canCreateAction(member, member.id, pairing)).toEqual({ allow: true });
    expect(canCreateAction(memberB, member.id, pairing)).toEqual({ allow: true });
    expect(canCreateAction(treasurer, member.id, pairing).allow).toBe(false);
  });

  it('lets only the owner complete', () => {
    expect(canCompleteAction(member, action)).toEqual({ allow: true });
    expect(canCompleteAction(memberB, action).allow).toBe(false);
    expect(canCompleteAction(admin, action).allow).toBe(false);
  });

  it('never lets the owner verify, including Admin-as-owner', () => {
    expect(canVerifyAction(member, action).allow).toBe(false);
    expect(canVerifyAction(memberB, action)).toEqual({ allow: true });
    expect(canVerifyAction(chapterLead, action)).toEqual({ allow: true });
    expect(canVerifyAction(admin, action)).toEqual({ allow: true });
    expect(
      canVerifyAction(admin, { ...action, ownerId: admin.id, partnerId: member.id })
        .allow,
    ).toBe(false);
    expect(canVerifyAction(treasurer, action).allow).toBe(false);
    expect(
      canVerifyAction(
        { ...chapterLead, chapterId: CHAPTER_B },
        action,
      ).allow,
    ).toBe(false);
  });

  it('rate-limits nudge to once per 24 hours', () => {
    expect(canNudge(memberB, action, now)).toEqual({ allow: true });
    expect(
      canNudge(
        memberB,
        { ...action, nudgedAt: '2026-07-01T00:00:00Z' },
        now,
      ).allow,
    ).toBe(false);
    expect(canNudge(chapterLead, action, now)).toEqual({ allow: true });
    expect(canNudge(admin, action, now)).toEqual({ allow: true });
    expect(canNudge(member, action, now).allow).toBe(false);
  });
});

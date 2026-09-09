import { describe, expect, it } from 'vitest';
import {
  canGenerateStatement,
  canRecordContribution,
  canViewChapterLedger,
  canViewMemberContributions,
  canVoidContribution,
} from '@/server/policy';
import {
  admin,
  CHAPTER_A,
  CHAPTER_B,
  chapterLead,
  member,
  memberB,
  treasurer,
} from './fixtures';

const now = new Date('2026-07-20T12:00:00Z');
const contribution = {
  profileId: member.id,
  chapterId: CHAPTER_A,
  createdAt: '2026-07-01T00:00:00Z',
  voidedAt: null,
};

describe('money policy', () => {
  it('lets a member view own contributions only', () => {
    const target = { profileId: member.id, chapterId: CHAPTER_A };
    expect(canViewMemberContributions(member, target)).toEqual({ allow: true });
    expect(canViewMemberContributions(memberB, target).allow).toBe(false);
    expect(canViewMemberContributions(treasurer, target)).toEqual({ allow: true });
    expect(canViewMemberContributions(chapterLead, target).allow).toBe(false);
    expect(canViewMemberContributions(admin, target)).toEqual({ allow: true });
  });

  it('lets treasurer (chapter) and admin record', () => {
    expect(canRecordContribution(treasurer, CHAPTER_A)).toEqual({ allow: true });
    expect(canRecordContribution(admin, CHAPTER_A)).toEqual({ allow: true });
    expect(canRecordContribution(admin, CHAPTER_B)).toEqual({ allow: true });
    expect(canRecordContribution(member, CHAPTER_A).allow).toBe(false);
    expect(canRecordContribution(chapterLead, CHAPTER_A).allow).toBe(false);
    expect(canRecordContribution(treasurer, CHAPTER_B).allow).toBe(false);
  });

  it('lets treasurer void within 30 days and admin anytime', () => {
    expect(canVoidContribution(treasurer, contribution, now)).toEqual({ allow: true });
    expect(canVoidContribution(admin, contribution, now)).toEqual({ allow: true });
    expect(canVoidContribution(member, contribution, now).allow).toBe(false);
    expect(canVoidContribution(chapterLead, contribution, now).allow).toBe(false);
    expect(
      canVoidContribution(
        treasurer,
        { ...contribution, createdAt: '2026-01-01T00:00:00Z' },
        now,
      ).allow,
    ).toBe(false);
    expect(
      canVoidContribution(
        admin,
        { ...contribution, createdAt: '2026-01-01T00:00:00Z' },
        now,
      ),
    ).toEqual({ allow: true });
  });

  it('lets a member generate only their own statement', () => {
    expect(canGenerateStatement(member, member.id)).toEqual({ allow: true });
    expect(canGenerateStatement(member, memberB.id).allow).toBe(false);
    expect(canGenerateStatement(admin, member.id).allow).toBe(false);
  });

  it('gates the chapter ledger to treasurer, chapter lead and admin', () => {
    expect(canViewChapterLedger(treasurer, CHAPTER_A)).toEqual({ allow: true });
    expect(canViewChapterLedger(chapterLead, CHAPTER_A)).toEqual({ allow: true });
    expect(canViewChapterLedger(admin, CHAPTER_A)).toEqual({ allow: true });
    expect(canViewChapterLedger(member, CHAPTER_A).allow).toBe(false);
    expect(canViewChapterLedger(treasurer, CHAPTER_B).allow).toBe(false);
  });
});

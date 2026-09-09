import { describe, expect, it } from 'vitest';
import {
  canAssignPairings,
  canChangeRole,
  canCreateSession,
  canDeactivateMember,
  canInviteMember,
  canLogClosedBusiness,
  canManageChapters,
  canVerifyClosedBusiness,
  canViewAuditEntry,
  canViewAuditLog,
  canViewCrmTokens,
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

describe('admin and org policy', () => {
  it('lets chapter lead invite up to treasurer, and never mint admin', () => {
    expect(canInviteMember(chapterLead, CHAPTER_A, 'MEMBER')).toEqual({ allow: true });
    expect(canInviteMember(chapterLead, CHAPTER_A, 'TREASURER')).toEqual({
      allow: true,
    });
    expect(canInviteMember(chapterLead, CHAPTER_A, 'CHAPTER_LEAD').allow).toBe(false);
    expect(canInviteMember(chapterLead, CHAPTER_A, 'ADMIN').allow).toBe(false);
    expect(canInviteMember(chapterLead, CHAPTER_B, 'MEMBER').allow).toBe(false);
    expect(canInviteMember(admin, CHAPTER_B, 'ADMIN')).toEqual({ allow: true });
    expect(canInviteMember(member, CHAPTER_A, 'MEMBER').allow).toBe(false);
  });

  it('lets chapter lead change roles at or below treasurer in chapter', () => {
    const target = { id: member.id, chapterId: CHAPTER_A, role: 'MEMBER' as const };
    expect(canChangeRole(chapterLead, target, 'TREASURER')).toEqual({ allow: true });
    expect(canChangeRole(chapterLead, target, 'CHAPTER_LEAD').allow).toBe(false);
    expect(canChangeRole(chapterLead, target, 'ADMIN').allow).toBe(false);
    expect(canChangeRole(admin, target, 'CHAPTER_LEAD')).toEqual({ allow: true });
    expect(canChangeRole(member, target, 'TREASURER').allow).toBe(false);
  });

  it('lets chapter lead deactivate in-chapter members and admin deactivate anyone', () => {
    const target = { id: member.id, chapterId: CHAPTER_A };
    expect(canDeactivateMember(chapterLead, target)).toEqual({ allow: true });
    expect(canDeactivateMember(admin, target)).toEqual({ allow: true });
    expect(canDeactivateMember(member, target).allow).toBe(false);
    expect(canDeactivateMember(chapterLead, { id: chapterLead.id, chapterId: CHAPTER_A }).allow).toBe(
      false,
    );
  });

  it('restricts chapter management to admin', () => {
    expect(canManageChapters(admin)).toEqual({ allow: true });
    expect(canManageChapters(chapterLead).allow).toBe(false);
    expect(canManageChapters(member).allow).toBe(false);
  });

  it('lets everyone open the audit log, with row scope by role', () => {
    expect(canViewAuditLog(member)).toEqual({ allow: true });
    const entry = { actorId: member.id, chapterId: CHAPTER_A };
    expect(canViewAuditEntry(member, entry)).toEqual({ allow: true });
    expect(canViewAuditEntry(memberB, entry).allow).toBe(false);
    expect(canViewAuditEntry(chapterLead, entry)).toEqual({ allow: true });
    expect(canViewAuditEntry(admin, entry)).toEqual({ allow: true });
    expect(canViewAuditEntry(treasurer, entry).allow).toBe(false);
  });

  it('lets chapter lead and admin create sessions and pairings', () => {
    expect(canCreateSession(chapterLead, CHAPTER_A)).toEqual({ allow: true });
    expect(canAssignPairings(admin, CHAPTER_B)).toEqual({ allow: true });
    expect(canCreateSession(member, CHAPTER_A).allow).toBe(false);
    expect(canCreateSession(treasurer, CHAPTER_A).allow).toBe(false);
  });

  it('lets participants log deals and leads/admins verify', () => {
    expect(canLogClosedBusiness(member, [member.id, memberB.id])).toEqual({
      allow: true,
    });
    expect(canLogClosedBusiness(treasurer, [member.id]).allow).toBe(false);
    expect(canVerifyClosedBusiness(chapterLead, CHAPTER_A)).toEqual({ allow: true });
    expect(canVerifyClosedBusiness(admin, CHAPTER_B)).toEqual({ allow: true });
    expect(canVerifyClosedBusiness(member, CHAPTER_A).allow).toBe(false);
  });

  it('never allows reading CRM tokens', () => {
    for (const visitor of [member, treasurer, chapterLead, admin]) {
      expect(canViewCrmTokens(visitor).allow).toBe(false);
    }
  });
});

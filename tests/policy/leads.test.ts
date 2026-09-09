import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  canDeleteLead,
  canEditLead,
  canReadThread,
  canRequestContactAccess,
  canRespondToRequest,
  canRevokeGrant,
  canViewLeadContact,
  canViewRedactedLead,
} from '@/server/policy';
import {
  admin,
  CHAPTER_A,
  chapterLead,
  inactive,
  member,
  memberB,
  otherChapter,
  treasurer,
} from './fixtures';

const lead = { id: 'lead-1', ownerId: member.id, chapterId: CHAPTER_A };
const now = new Date('2026-07-01T12:00:00Z');
const grant = {
  leadId: lead.id,
  granteeId: memberB.id,
  revokedAt: null,
  expiresAt: null,
};

describe('canViewLeadContact', () => {
  it('has no ADMIN branch in the implementation', () => {
    const src = readFileSync(
      resolve(process.cwd(), 'src/server/policy/leads.ts'),
      'utf8',
    );
    const start = src.indexOf('export function canViewLeadContact');
    const end = src.indexOf('export function canViewRedactedLead');
    const body = src.slice(start, end);
    expect(body).toContain('absence of an admin branch');
    expect(body).not.toMatch(/ADMIN/);
  });

  it('allows the owner', () => {
    expect(canViewLeadContact(member, lead, [], now)).toEqual({ allow: true });
  });

  it('allows an active grantee and nobody else, including Admin', () => {
    expect(canViewLeadContact(memberB, lead, [grant], now)).toEqual({ allow: true });
    for (const visitor of [treasurer, chapterLead, admin, otherChapter]) {
      expect(canViewLeadContact(visitor, lead, [grant], now).allow).toBe(false);
    }
  });

  it('denies a revoked or expired grant', () => {
    expect(
      canViewLeadContact(
        memberB,
        lead,
        [{ ...grant, revokedAt: now.toISOString() }],
        now,
      ).allow,
    ).toBe(false);
    expect(
      canViewLeadContact(
        memberB,
        lead,
        [{ ...grant, expiresAt: '2026-06-01T00:00:00Z' }],
        now,
      ).allow,
    ).toBe(false);
  });

  it('denies an inactive actor even with a grant', () => {
    expect(
      canViewLeadContact({ ...memberB, active: false }, lead, [grant], now).allow,
    ).toBe(false);
  });
});

describe('redacted lead and edits', () => {
  it('allows same-chapter members to view the redacted pool card', () => {
    expect(canViewRedactedLead(memberB, CHAPTER_A)).toEqual({ allow: true });
    expect(canViewRedactedLead(treasurer, CHAPTER_A)).toEqual({ allow: true });
    expect(canViewRedactedLead(chapterLead, CHAPTER_A)).toEqual({ allow: true });
    expect(canViewRedactedLead(admin, CHAPTER_A)).toEqual({ allow: true });
    expect(canViewRedactedLead(otherChapter, CHAPTER_A).allow).toBe(false);
    expect(canViewRedactedLead(inactive, CHAPTER_A).allow).toBe(false);
  });

  it('allows only the owner to edit or delete', () => {
    expect(canEditLead(member, lead)).toEqual({ allow: true });
    expect(canDeleteLead(member, lead)).toEqual({ allow: true });
    for (const visitor of [memberB, treasurer, chapterLead, admin]) {
      expect(canEditLead(visitor, lead).allow).toBe(false);
      expect(canDeleteLead(visitor, lead).allow).toBe(false);
    }
  });
});

describe('contact access requests and grants', () => {
  it('allows a same-chapter non-owner to request when no open request exists', () => {
    expect(canRequestContactAccess(memberB, lead, [])).toEqual({ allow: true });
    expect(canRequestContactAccess(treasurer, lead, [])).toEqual({ allow: true });
    expect(canRequestContactAccess(chapterLead, lead, [])).toEqual({ allow: true });
    expect(canRequestContactAccess(admin, lead, [])).toEqual({ allow: true });
    expect(canRequestContactAccess(member, lead, []).allow).toBe(false);
    expect(canRequestContactAccess(otherChapter, lead, []).allow).toBe(false);
    expect(
      canRequestContactAccess(memberB, lead, [
        {
          leadId: lead.id,
          requesterId: memberB.id,
          ownerId: member.id,
          status: 'PENDING',
        },
      ]).allow,
    ).toBe(false);
  });

  it('allows only the owner to respond to a pending request', () => {
    const request = { ownerId: member.id, status: 'PENDING' as const };
    expect(canRespondToRequest(member, request)).toEqual({ allow: true });
    for (const visitor of [memberB, treasurer, chapterLead, admin]) {
      expect(canRespondToRequest(visitor, request).allow).toBe(false);
    }
    expect(canRespondToRequest(member, { ...request, status: 'APPROVED' }).allow).toBe(
      false,
    );
  });

  it('allows only the grantor to revoke', () => {
    const row = { grantorId: member.id, revokedAt: null };
    expect(canRevokeGrant(member, row)).toEqual({ allow: true });
    for (const visitor of [memberB, treasurer, chapterLead, admin]) {
      expect(canRevokeGrant(visitor, row).allow).toBe(false);
    }
  });
});

describe('canReadThread', () => {
  const leadA = { ownerId: member.id };
  const leadB = { ownerId: memberB.id };

  it('allows only the two lead owners', () => {
    expect(canReadThread(member, leadA, leadB)).toEqual({ allow: true });
    expect(canReadThread(memberB, leadA, leadB)).toEqual({ allow: true });
    expect(canReadThread(treasurer, leadA, leadB).allow).toBe(false);
    expect(canReadThread(chapterLead, leadA, leadB).allow).toBe(false);
    expect(canReadThread(admin, leadA, leadB).allow).toBe(false);
  });
});

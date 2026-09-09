import { describe, expect, it } from 'vitest';
import { admin, member, memberB } from '../policy/fixtures';
import { applyVerifyAction } from '@/server/services/accountability-transitions';

const action = {
  ownerId: member.id,
  partnerId: memberB.id,
  chapterId: member.chapterId,
  status: 'COMPLETED',
  nudgedAt: null,
};

describe('owner cannot verify — Server Action layer', () => {
  it('refuses the owner without writing, including Admin-as-owner', async () => {
    let wrote = false;
    const ownerResult = await applyVerifyAction(member, action, async () => {
      wrote = true;
      return { error: null };
    });
    expect(ownerResult.ok).toBe(false);
    expect(wrote).toBe(false);

    const adminOwner = await applyVerifyAction(
      admin,
      { ...action, ownerId: admin.id, partnerId: member.id },
      async () => {
        wrote = true;
        return { error: null };
      },
    );
    expect(adminOwner.ok).toBe(false);
    expect(wrote).toBe(false);
  });

  it('lets the partner write', async () => {
    let wrote = false;
    const result = await applyVerifyAction(memberB, action, async () => {
      wrote = true;
      return { error: null };
    });
    expect(result.ok).toBe(true);
    expect(wrote).toBe(true);
  });
});

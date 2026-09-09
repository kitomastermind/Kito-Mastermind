import { describe, expect, it } from 'vitest';
import { digestWouldSkip } from '@/server/services/notification-copy';

describe('daily digest skip', () => {
  it('skips members with nothing pending', () => {
    expect(
      digestWouldSkip({
        emailDigest: true,
        unread: [{ type: 'ACCESS_REQUESTED', emailedAt: '2026-09-01T00:00:00Z' }],
      }),
    ).toBe(true);
    expect(
      digestWouldSkip({
        emailDigest: false,
        unread: [{ type: 'LEAD_MATCH', emailedAt: null }],
      }),
    ).toBe(true);
    expect(
      digestWouldSkip({
        emailDigest: true,
        unread: [{ type: 'LEAD_MATCH', emailedAt: null }],
      }),
    ).toBe(false);
  });
});

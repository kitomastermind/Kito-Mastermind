import { describe, expect, it } from 'vitest';
import {
  NOTIFICATION_TYPES,
  notificationCopy,
  type NotificationCopyInput,
} from '@/server/services/notification-copy';

const SENTINELS = [
  'ZZQX-SENTINEL-NAME',
  '+254700000ZZQ',
  'zzqx-sentinel@example.invalid',
  'ZZQX-SENTINEL-NOTE',
];

const SENTINEL_LEAD = {
  clientName: 'ZZQX-SENTINEL-NAME',
  clientPhone: '+254700000ZZQ',
  clientEmail: 'zzqx-sentinel@example.invalid',
  notes: 'ZZQX-SENTINEL-NOTE',
  ownerName: 'Grace Wanjiru',
  areaLabel: 'Lavington',
  leadType: 'BUYER',
};

function redactedInput(): NotificationCopyInput {
  return {
    otherName: SENTINEL_LEAD.ownerName,
    areaLabel: SENTINEL_LEAD.areaLabel,
    leadType: SENTINEL_LEAD.leadType,
    dueLabel: '15 Jul',
    topicTitle: 'Escalation-clause caps',
    pointsLabel: 'Attendance, 20 points',
    matchId: '00000000-0000-4000-8000-000000000001',
    leadId: '00000000-0000-4000-8000-000000000002',
    topicId: '00000000-0000-4000-8000-000000000003',
  };
}

describe('notification copy never carries client PII', () => {
  it('covers every notification type against a sentinel lead', () => {
    const input = redactedInput();
    expect(NOTIFICATION_TYPES).toHaveLength(17);
    for (const type of NOTIFICATION_TYPES) {
      const copy = notificationCopy(type, input);
      const haystack = `${copy.title}\n${copy.body}\n${copy.linkPath ?? ''}`;
      for (const sentinel of SENTINELS) {
        expect(haystack, `${type} leaked ${sentinel}`).not.toContain(sentinel);
      }
    }
  });
});

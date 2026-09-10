import { describe, expect, it } from 'vitest';
import { renderDigestEmail } from '@/server/email/digest';
import { renderInviteEmail } from '@/server/email/invite';
import { renderNotificationEmail } from '@/server/email/notification';
import { EMAIL } from '@/server/email/tokens';

const SENTINELS = [
  'ZZQX-SENTINEL-NAME',
  '+254700000ZZQ',
  'zzqx-sentinel@example.invalid',
  'ZZQX-SENTINEL-NOTE',
];

const BRAND = [EMAIL.forest, EMAIL.lime, EMAIL.gold, 'KITO Mastermind'] as const;

describe('branded transactional email', () => {
  it('renders notification, invite and digest chrome without client PII', async () => {
    const inviteUrl = 'https://app.example.test/invite/token-abc';
    const notification = await renderNotificationEmail(
      'Access request',
      'Amara Njeri requested contact access on a buyer lead in Lavington.',
      { href: '/leads' },
    );
    const invite = await renderInviteEmail(inviteUrl);
    const digest = await renderDigestEmail([
      { title: 'Action due', body: 'An action step is due 15 Jul.' },
    ]);

    for (const rendered of [notification, invite, digest]) {
      for (const token of BRAND) {
        expect(rendered.html).toContain(token);
      }
      for (const sentinel of SENTINELS) {
        expect(rendered.html).not.toContain(sentinel);
        expect(rendered.text).not.toContain(sentinel);
      }
    }

    expect(invite.html).toContain(inviteUrl);
    expect(invite.text).toContain(inviteUrl);
    expect(notification.html).toContain('/leads');
    expect(digest.text).toContain('Action due');
  });
});

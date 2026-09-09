import { describe, expect, it } from 'vitest';
import { sentryBeforeSend } from '@/lib/sentry-scrub';

describe('Sentry PII scrubbing', () => {
  it('redacts deny-listed fields from a deliberate error payload', () => {
    const event = sentryBeforeSend({
      extra: {
        client_name: 'Susan Kamau',
        client_phone: '+254700111001',
        client_email: 'susan.kamau@example.invalid',
        notes: 'Prefers a quiet cul-de-sac',
        phone: '+254700000000',
        email: 'grace.wanjiru@kito.test',
        password: 'secret',
        access_token_enc: 'abc',
        TransID: 'QHX123',
        safe: 'ok',
      },
    });
    expect(event.extra?.client_name).toBe('[redacted]');
    expect(event.extra?.client_phone).toBe('[redacted]');
    expect(event.extra?.notes).toBe('[redacted]');
    expect(event.extra?.access_token_enc).toBe('[redacted]');
    expect(event.extra?.TransID).toBe('[redacted]');
    expect(event.extra?.safe).toBe('ok');
  });
});

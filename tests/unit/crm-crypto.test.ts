import { describe, expect, it } from 'vitest';
import { decryptSecret, encryptSecret } from '@/server/admin/crm-crypto';

describe('CRM token encryption', () => {
  it('round-trips a token and never returns the raw value from encrypt', () => {
    process.env.ENCRYPTION_KEY = Buffer.alloc(32, 7).toString('base64');
    const token = 'crm-access-token-example';
    const enc = encryptSecret(token);
    expect(enc).not.toContain(token);
    expect(decryptSecret(enc)).toBe(token);
  });
});

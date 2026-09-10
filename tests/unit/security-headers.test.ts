import { describe, expect, it } from 'vitest';
import { buildCsp, SECURITY_HEADERS } from '@/lib/security-headers';

describe('security headers', () => {
  it('sets CSP without unsafe-inline', () => {
    const csp = buildCsp('test-nonce');
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("nonce-test-nonce");
    expect(csp).toMatch(/script-src [^;]*nonce-test-nonce/);
    expect(csp).not.toMatch(/script-src [^;]*unsafe-inline/);
    expect(SECURITY_HEADERS.some((row) => row.key === 'X-Frame-Options')).toBe(true);
  });
});

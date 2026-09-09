import { describe, expect, it } from 'vitest';
import { accountReference, parseStkCallback, shillingsFromCents, stkPassword, stkTimestamp } from '@/server/services/mpesa';

describe('mpesa helpers', () => {
  it('builds password, account reference and shilling conversion without floats', () => {
    expect(stkPassword('174379', 'pass', '20260909120000')).toBe(
      Buffer.from('174379pass20260909120000', 'utf8').toString('base64'),
    );
    expect(accountReference('NBO', 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee')).toBe('KITO-NBO-aaaaaaaa');
    expect(shillingsFromCents(BigInt(500_000))).toBe(BigInt(5000));
    expect(stkTimestamp(new Date('2026-09-09T12:00:00Z'))).toBe('20260909120000');
  });

  it('parses an STK callback body', () => {
    const parsed = parseStkCallback({
      Body: {
        stkCallback: {
          CheckoutRequestID: 'ws_CO_1',
          ResultCode: 0,
          ResultDesc: 'The service request is processed successfully.',
          CallbackMetadata: {
            Item: [
              { Name: 'Amount', Value: 5000 },
              { Name: 'MpesaReceiptNumber', Value: 'NLJ7RT61SV' },
            ],
          },
        },
      },
    });
    expect(parsed).toEqual({
      checkoutRequestId: 'ws_CO_1',
      resultCode: 0,
      resultDesc: 'The service request is processed successfully.',
      receipt: 'NLJ7RT61SV',
    });
  });
});

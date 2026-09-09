const DENY = new Set([
  'client_name',
  'clientName',
  'client_phone',
  'clientPhone',
  'client_email',
  'clientEmail',
  'notes',
  'phone',
  'email',
  'password',
  'passwordHash',
  'access_token_enc',
  'accessTokenEnc',
  'refresh_token_enc',
  'refreshTokenEnc',
  'mpesa_receipt_number',
  'MpesaReceiptNumber',
  'raw_callback',
  'rawCallback',
  'CallbackMetadata',
  'Body',
  'stkCallback',
  'MSISDN',
  'TransID',
  'BillRefNumber',
  'TransAmount',
  'checkout_request_id',
  'CheckoutRequestID',
]);

export function scrubPii(value: unknown): unknown {
  if (value === null || value === undefined) return value;
  if (Array.isArray(value)) return value.map(scrubPii);
  if (typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
      out[key] = DENY.has(key) ? '[redacted]' : scrubPii(nested);
    }
    return out;
  }
  return value;
}

export function sentryBeforeSend<T extends { extra?: Record<string, unknown>; request?: { data?: unknown } }>(
  event: T,
): T {
  if (event.extra) event.extra = scrubPii(event.extra) as Record<string, unknown>;
  if (event.request?.data) event.request.data = scrubPii(event.request.data);
  return event;
}

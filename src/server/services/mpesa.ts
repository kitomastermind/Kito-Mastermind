const TOKEN_TTL_MS = 55 * 60 * 1000;

type TokenCache = { value: string; expiresAt: number };

let tokenCache: TokenCache | null = null;

export function mpesaEnabled(): boolean {
  return process.env.MPESA_ENABLED === 'true';
}

export function mpesaBaseUrl(): string {
  return process.env.MPESA_ENV === 'production'
    ? 'https://api.safaricom.co.ke'
    : 'https://sandbox.safaricom.co.ke';
}

export function stkPassword(shortcode: string, passkey: string, timestamp: string): string {
  return Buffer.from(`${shortcode}${passkey}${timestamp}`, 'utf8').toString('base64');
}

export function stkTimestamp(now = new Date()): string {
  const y = now.getUTCFullYear().toString();
  const m = String(now.getUTCMonth() + 1).padStart(2, '0');
  const d = String(now.getUTCDate()).padStart(2, '0');
  const h = String(now.getUTCHours()).padStart(2, '0');
  const min = String(now.getUTCMinutes()).padStart(2, '0');
  const s = String(now.getUTCSeconds()).padStart(2, '0');
  return `${y}${m}${d}${h}${min}${s}`;
}

export function accountReference(chapterCode: string, profileId: string): string {
  return `KITO-${chapterCode}-${profileId.replaceAll('-', '').slice(0, 8)}`;
}

export function shillingsFromCents(cents: bigint): bigint {
  return cents / BigInt(100);
}

async function darajaToken(): Promise<string> {
  if (tokenCache && tokenCache.expiresAt > Date.now()) return tokenCache.value;
  const key = process.env.MPESA_CONSUMER_KEY ?? '';
  const secret = process.env.MPESA_CONSUMER_SECRET ?? '';
  const auth = Buffer.from(`${key}:${secret}`).toString('base64');
  const response = await fetch(
    `${mpesaBaseUrl()}/oauth/v1/generate?grant_type=client_credentials`,
    { headers: { Authorization: `Basic ${auth}` } },
  );
  if (!response.ok) {
    throw new Error('Could not obtain an M-Pesa token');
  }
  const body = (await response.json()) as { access_token?: string };
  if (!body.access_token) throw new Error('M-Pesa token missing');
  tokenCache = { value: body.access_token, expiresAt: Date.now() + TOKEN_TTL_MS };
  return body.access_token;
}

export async function stkPush(input: {
  phone: string;
  amountShillings: bigint;
  accountReference: string;
  description: string;
}): Promise<{ merchantRequestId: string; checkoutRequestId: string }> {
  if (!mpesaEnabled()) {
    throw new Error('M-Pesa is not configured yet. Ask your treasurer to record the payment.');
  }
  const shortcode = process.env.MPESA_SHORTCODE ?? '';
  const passkey = process.env.MPESA_PASSKEY ?? '';
  const timestamp = stkTimestamp();
  const token = await darajaToken();
  const response = await fetch(`${mpesaBaseUrl()}/mpesa/stkpush/v1/processrequest`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      BusinessShortCode: shortcode,
      Password: stkPassword(shortcode, passkey, timestamp),
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: Number(input.amountShillings),
      PartyA: input.phone.replace('+', ''),
      PartyB: shortcode,
      PhoneNumber: input.phone.replace('+', ''),
      CallBackURL: process.env.MPESA_CALLBACK_URL,
      AccountReference: input.accountReference,
      TransactionDesc: input.description.slice(0, 13),
    }),
  });
  const body = (await response.json()) as {
    MerchantRequestID?: string;
    CheckoutRequestID?: string;
    errorMessage?: string;
    ResponseDescription?: string;
  };
  if (!body.CheckoutRequestID) {
    throw new Error(body.errorMessage ?? body.ResponseDescription ?? 'STK Push failed');
  }
  return {
    merchantRequestId: body.MerchantRequestID ?? '',
    checkoutRequestId: body.CheckoutRequestID,
  };
}

export async function stkQuery(checkoutRequestId: string): Promise<{
  resultCode: number;
  resultDesc: string;
  receipt?: string;
}> {
  const shortcode = process.env.MPESA_SHORTCODE ?? '';
  const passkey = process.env.MPESA_PASSKEY ?? '';
  const timestamp = stkTimestamp();
  const token = await darajaToken();
  const response = await fetch(`${mpesaBaseUrl()}/mpesa/stkpushquery/v1/query`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      BusinessShortCode: shortcode,
      Password: stkPassword(shortcode, passkey, timestamp),
      Timestamp: timestamp,
      CheckoutRequestID: checkoutRequestId,
    }),
  });
  const body = (await response.json()) as {
    ResultCode?: string | number;
    ResultDesc?: string;
    CallbackMetadata?: { Item?: Array<{ Name: string; Value?: string | number }> };
  };
  return {
    resultCode: Number(body.ResultCode ?? 1),
    resultDesc: body.ResultDesc ?? 'Unknown',
    receipt: body.CallbackMetadata?.Item?.find((item) => item.Name === 'MpesaReceiptNumber')?.Value
      ? String(body.CallbackMetadata.Item.find((item) => item.Name === 'MpesaReceiptNumber')?.Value)
      : undefined,
  };
}

export function parseStkCallback(raw: Record<string, unknown>): {
  checkoutRequestId: string;
  resultCode: number;
  resultDesc: string;
  receipt: string | null;
} {
  const body = (raw.Body ?? raw) as Record<string, unknown>;
  const callback = (body.stkCallback ?? body) as Record<string, unknown>;
  const metadata = callback.CallbackMetadata as
    | { Item?: Array<{ Name: string; Value?: string | number }> }
    | undefined;
  const receiptItem = metadata?.Item?.find((item) => item.Name === 'MpesaReceiptNumber');
  return {
    checkoutRequestId: String(callback.CheckoutRequestID ?? ''),
    resultCode: Number(callback.ResultCode ?? 1),
    resultDesc: String(callback.ResultDesc ?? ''),
    receipt: receiptItem?.Value ? String(receiptItem.Value) : null,
  };
}

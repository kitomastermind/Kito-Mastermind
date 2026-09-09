import { supabaseAdmin } from '@/server/admin/client';

const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES = 5;

export type LoginGate =
  | { ok: true }
  | { ok: false; retryAfterMinutes: number };

export async function checkLoginRateLimit(email: string): Promise<LoginGate> {
  const since = new Date(Date.now() - WINDOW_MS).toISOString();
  const { data, error } = await supabaseAdmin
    .from('login_attempts')
    .select('succeeded, occurred_at')
    .ilike('email', email)
    .gte('occurred_at', since)
    .order('occurred_at', { ascending: false });
  if (error) {
    throw error;
  }

  let failures = 0;
  for (const row of data ?? []) {
    if (row.succeeded) break;
    failures += 1;
  }
  if (failures < MAX_FAILURES) {
    return { ok: true };
  }
  const oldest = data?.[MAX_FAILURES - 1];
  const occurred = oldest ? new Date(oldest.occurred_at).getTime() : Date.now();
  const retryAfterMinutes = Math.max(
    1,
    Math.ceil((occurred + WINDOW_MS - Date.now()) / 60000),
  );
  return { ok: false, retryAfterMinutes };
}

export async function recordLoginAttempt(
  email: string,
  succeeded: boolean,
): Promise<void> {
  const { error } = await supabaseAdmin.from('login_attempts').insert({
    email: email.toLowerCase(),
    succeeded,
  });
  if (error) {
    throw error;
  }
}

export async function writeLoginAudit(
  action: 'LOGIN_FAILED' | 'LOGIN_LOCKED',
  email: string,
): Promise<void> {
  const { error } = await supabaseAdmin.from('audit_log').insert({
    actor_id: null,
    action,
    subject_type: 'auth',
    subject_id: null,
    metadata: { email },
  });
  if (error) {
    throw error;
  }
}

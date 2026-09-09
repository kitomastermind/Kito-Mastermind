import type { Actor } from '@/server/policy';
import {
  canCompleteAction,
  canCreateAction,
  canNudge,
  canVerifyAction,
  type ActionSubject,
  type PairingSubject,
} from '@/server/policy/accountability';
import type { ActionResult } from '@/server/actions/result';

export function refuseCreateAction(
  actor: Actor,
  ownerId: string,
  pairing: PairingSubject | null,
): string | null {
  const decision = canCreateAction(actor, ownerId, pairing);
  return decision.allow ? null : decision.reason;
}

export function refuseCompleteAction(
  actor: Actor,
  action: ActionSubject,
): string | null {
  const decision = canCompleteAction(actor, action);
  return decision.allow ? null : decision.reason;
}

export async function applyVerifyAction(
  actor: Actor,
  action: ActionSubject,
  write: () => Promise<{ error: { message: string } | null }>,
): Promise<ActionResult<void>> {
  const decision = canVerifyAction(actor, action);
  if (!decision.allow) return { ok: false, error: decision.reason };
  const { error } = await write();
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: undefined };
}

export function refuseNudge(
  actor: Actor,
  action: ActionSubject,
  now: Date,
): string | null {
  const decision = canNudge(actor, action, now);
  return decision.allow ? null : decision.reason;
}

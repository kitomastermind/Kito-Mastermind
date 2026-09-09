import { cronUnauthorized } from '@/server/admin/cron-auth';
import { pollDroppedStk } from '@/server/admin/stk-poll';

export async function GET(request: Request): Promise<Response> {
  const denied = cronUnauthorized(request);
  if (denied) return denied;
  const result = await pollDroppedStk();
  return Response.json({ ok: true, ...result });
}

import { cronUnauthorized } from '@/server/admin/cron-auth';
import { purgeStaleLeadPii } from '@/server/admin/dues';

export async function GET(request: Request): Promise<Response> {
  const denied = cronUnauthorized(request);
  if (denied) return denied;
  const result = await purgeStaleLeadPii();
  return Response.json({ ok: true, ...result });
}

import { cronUnauthorized } from '@/server/admin/cron-auth';
import { rescanMatches } from '@/server/admin/match-rescan';
import { logger } from '@/lib/logger';

export async function GET(request: Request): Promise<Response> {
  const denied = cronUnauthorized(request);
  if (denied) return denied;
  const result = await rescanMatches();
  logger.info('match-rescan', result);
  return Response.json({ ok: true, ...result });
}

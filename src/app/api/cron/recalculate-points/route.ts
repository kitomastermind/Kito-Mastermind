import { cronUnauthorized } from '@/server/admin/cron-auth';
import { recalculateAllCurrentCycle } from '@/server/admin/recalculate-points';
import { logger } from '@/lib/logger';

export async function GET(request: Request): Promise<Response> {
  const denied = cronUnauthorized(request);
  if (denied) return denied;
  const result = await recalculateAllCurrentCycle();
  logger.info('recalculate-points', result);
  return Response.json({ ok: true, ...result });
}

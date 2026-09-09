import { cronUnauthorized } from '@/server/admin/cron-auth';
import { markOverdueActions } from '@/server/admin/overdue-actions';
import { logger } from '@/lib/logger';

export async function GET(request: Request): Promise<Response> {
  const denied = cronUnauthorized(request);
  if (denied) return denied;
  const result = await markOverdueActions();
  logger.info('overdue-actions', result);
  return Response.json({ ok: true, ...result });
}

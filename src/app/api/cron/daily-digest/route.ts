import { cronUnauthorized } from '@/server/admin/cron-auth';
import { sendDailyDigests } from '@/server/admin/daily-digest';
import { logger } from '@/lib/logger';

export async function GET(request: Request): Promise<Response> {
  const denied = cronUnauthorized(request);
  if (denied) return denied;
  const result = await sendDailyDigests();
  logger.info('daily-digest', result);
  return Response.json({ ok: true, ...result });
}

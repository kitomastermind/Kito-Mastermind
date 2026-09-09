import { cronUnauthorized } from '@/server/admin/cron-auth';
import { expirePendingRequests } from '@/server/admin/expire-requests';
import { logger } from '@/lib/logger';

export async function GET(request: Request): Promise<Response> {
  const denied = cronUnauthorized(request);
  if (denied) return denied;
  const expired = await expirePendingRequests();
  logger.info('expire-requests', { expired });
  return Response.json({ ok: true, expired });
}

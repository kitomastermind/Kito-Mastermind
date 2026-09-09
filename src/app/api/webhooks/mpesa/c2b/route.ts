import { applyC2bConfirmation } from '@/server/admin/c2b';
import { logger } from '@/lib/logger';

export async function POST(request: Request): Promise<Response> {
  let raw: Record<string, unknown> = {};
  try {
    raw = (await request.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ ResultCode: 0, ResultDesc: 'Accepted' });
  }
  try {
    await applyC2bConfirmation(raw);
  } catch (caught) {
    logger.error('c2b-callback', {
      message: caught instanceof Error ? caught.message : 'callback-failed',
    });
  }
  return Response.json({ ResultCode: 0, ResultDesc: 'Accepted' });
}

import { applyStkCallback } from '@/server/admin/stk-callback';
import { logger } from '@/lib/logger';

export async function POST(request: Request): Promise<Response> {
  let raw: Record<string, unknown> = {};
  try {
    raw = (await request.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ ok: true });
  }
  try {
    await applyStkCallback(raw);
  } catch (caught) {
    logger.error('stk-callback', {
      message: caught instanceof Error ? caught.message : 'callback-failed',
    });
  }
  return Response.json({ ok: true });
}

import { supabaseAdmin } from '@/server/admin/client';
import { logger } from '@/lib/logger';

export async function generateDuesForMonth(now = new Date()): Promise<{ inserted: number }> {
  const periodKey = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
  const dueDate = `${periodKey}-15`;
  const { data, error } = await supabaseAdmin.rpc('generate_month_dues', {
    p_period_key: periodKey,
    p_due_date: dueDate,
  });
  if (error) throw error;
  logger.info('dues-generation', { periodKey, inserted: data });
  return { inserted: data ?? 0 };
}

export async function purgeStaleLeadPii(): Promise<{ purged: number }> {
  const { data, error } = await supabaseAdmin.rpc('purge_stale_lead_pii');
  if (error) throw error;
  return { purged: data ?? 0 };
}

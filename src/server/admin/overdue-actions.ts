import { supabaseAdmin } from '@/server/admin/client';
import { deliverNotification } from '@/server/admin/notify';
import { notificationCopy } from '@/server/services/notification-copy';
import { formatNairobiDate } from '@/lib/format';

export async function markOverdueActions(
  now = new Date(),
): Promise<{ marked: number }> {
  const today = now.toISOString().slice(0, 10);
  const { data, error } = await supabaseAdmin
    .from('accountability_actions')
    .select('id, owner_id, due_date, status')
    .in('status', ['NOT_STARTED', 'IN_PROGRESS'])
    .lt('due_date', today);
  if (error) throw error;
  let marked = 0;
  for (const row of data ?? []) {
    const { data: updated, error: updateError } = await supabaseAdmin
      .from('accountability_actions')
      .update({ status: 'OVERDUE' })
      .eq('id', row.id)
      .in('status', ['NOT_STARTED', 'IN_PROGRESS'])
      .select('id');
    if (updateError) throw updateError;
    if (!updated?.length) continue;
    await deliverNotification({
      profileId: row.owner_id,
      type: 'ACCOUNTABILITY_OVERDUE',
      copy: notificationCopy('ACCOUNTABILITY_OVERDUE', {
        otherName: 'Your partner',
        dueLabel: formatNairobiDate(row.due_date, 'd MMM'),
      }),
    });
    marked += 1;
  }
  return { marked };
}

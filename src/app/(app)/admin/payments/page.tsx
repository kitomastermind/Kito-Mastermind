import { redirect } from 'next/navigation';
import { PageHeader } from '@/components/kito/PageHeader';
import { canRecordContribution } from '@/server/policy';
import { createClient, requireActor } from '@/server/supabase/server';
import { PaymentsQueue } from './queue';
import { formatKES } from '@/server/services/money';

export default async function PaymentsPage() {
  const actor = await requireActor();
  if (!canRecordContribution(actor, actor.chapterId).allow) {
    if (actor.role !== 'CHAPTER_LEAD' && actor.role !== 'ADMIN') redirect('/dashboard');
  }
  const supabase = await createClient();
  const { data: payments } = await supabase
    .from('mpesa_payments')
    .select('id, phone_number, amount, account_reference, created_at, mpesa_receipt_number')
    .is('contribution_id', null)
    .eq('result_code', 0)
    .order('created_at', { ascending: false });
  const { data: pending } = await supabase
    .from('contributions')
    .select('id, description, amount, profile_id')
    .eq('status', 'PENDING')
    .is('voided_at', null);
  return (
    <>
      <PageHeader eyebrow="Administration" title="Unallocated payments" />
      <PaymentsQueue
        payments={(payments ?? []).map((row) => ({
          id: row.id,
          phone: row.phone_number,
          amountLabel: formatKES(BigInt(String(row.amount))),
          reference: row.account_reference ?? '—',
          receipt: row.mpesa_receipt_number ?? '—',
        }))}
        contributions={(pending ?? []).map((row) => ({
          id: row.id,
          label: `${row.description} · ${formatKES(BigInt(String(row.amount)))}`,
        }))}
      />
    </>
  );
}

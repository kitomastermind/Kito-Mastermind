import type { Admin } from './util';
import { must } from './util';

export async function seedClosedAndInbox(
  admin: Admin,
  chapterId: string,
  graceId: string,
  aminaId: string,
): Promise<void> {
  const deal = await must(
    'closed-business',
    admin
      .from('closed_business')
      .insert({
        chapter_id: chapterId,
        sale_volume: '4260000000',
        closed_at: '2026-08-15',
        created_by: graceId,
      })
      .select('id')
      .single(),
  );
  await must(
    'closed-participants',
    admin.from('closed_business_participants').insert({
      closed_business_id: deal.id,
      profile_id: graceId,
      participant_role: 'CLOSER',
      credit_share: 100,
      confirmed_at: '2026-08-15T12:00:00+03:00',
    }),
  );
  await must(
    'closed-verify',
    admin
      .from('closed_business')
      .update({
        verified_by: aminaId,
        verified_at: '2026-08-16T10:00:00+03:00',
      })
      .eq('id', deal.id)
      .select('id')
      .single(),
  );
  await must(
    'grace-inbox',
    admin.from('notifications').insert([
      {
        profile_id: graceId,
        type: 'LEAD_MATCH',
        title: 'New lead match found',
        body: 'Kevin Mwangi logged a matching lead in Lavington.',
        link_path: '/leads',
      },
      {
        profile_id: graceId,
        type: 'ACCOUNTABILITY_DUE',
        title: 'Action due',
        body: 'An action step is due 28 Sep.',
        link_path: '/accountability',
      },
    ]),
  );
}

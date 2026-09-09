import type { Admin } from './util';
import { must } from './util';

const MONTHS = [
  { key: '2026-04', paid: '2026-04-15', shillings: 548_000, graceExtra: 45_000 },
  { key: '2026-05', paid: '2026-05-15', shillings: 571_000, graceExtra: 45_000 },
  { key: '2026-06', paid: '2026-06-15', shillings: 509_000, graceExtra: 46_500 },
  { key: '2026-07', paid: '2026-07-15', shillings: 633_000, graceExtra: 12_000 },
  { key: '2026-08', paid: '2026-08-15', shillings: 590_000, graceExtra: 10_500 },
  { key: '2026-09', paid: '2026-09-15', shillings: 612_000, graceExtra: 0 },
] as const;

export async function seedMoneyAndSessions(
  admin: Admin,
  chapterId: string,
  cycleId: string,
  memberIds: string[],
  graceId: string,
  danielId: string,
  leadId: string,
): Promise<void> {
  await must(
    'dues_schedule',
    admin.from('dues_schedules').insert({
      chapter_id: chapterId,
      amount: '500000',
      day_of_month: 15,
      effective_from: '2026-01-01',
    }),
  );
  await seedContributions(admin, chapterId, memberIds, graceId);
  await seedSessions(admin, chapterId, cycleId, memberIds, graceId, danielId, leadId);
}

async function seedContributions(
  admin: Admin,
  chapterId: string,
  memberIds: string[],
  graceId: string,
): Promise<void> {
  const others = memberIds.filter((id) => id !== graceId);
  const rows: Record<string, unknown>[] = [];
  for (const month of MONTHS) {
    const outstanding = month.key === '2026-09';
    for (const profileId of memberIds) {
      const gracePending = outstanding && profileId === graceId;
      rows.push({
        profile_id: profileId,
        chapter_id: chapterId,
        type: 'DUES',
        description: `Monthly dues ${month.key}`,
        amount: '500000',
        method: gracePending ? null : 'MPESA',
        status: gracePending ? 'PENDING' : 'PAID',
        due_date: `${month.key}-15`,
        paid_at: gracePending ? null : `${month.paid}T10:00:00+03:00`,
        recorded_by: graceId,
        period_key: month.key,
      });
    }
    if (month.graceExtra > 0) {
      rows.push({
        profile_id: graceId,
        chapter_id: chapterId,
        type: 'EVENT_FEE',
        description: `Chapter event ${month.key}`,
        amount: String(month.graceExtra * 100),
        method: 'MPESA',
        status: 'PAID',
        paid_at: `${month.paid}T11:00:00+03:00`,
        recorded_by: graceId,
      });
    }
    const paidDues = outstanding ? (memberIds.length - 1) * 5_000 : memberIds.length * 5_000;
    const leftover = month.shillings - paidDues - month.graceExtra;
    if (leftover > 0 && others[0]) {
      rows.push({
        profile_id: others[0],
        chapter_id: chapterId,
        type: 'DONATION',
        description: `Chapter pool ${month.key}`,
        amount: String(leftover * 100),
        method: 'BANK_TRANSFER',
        status: 'PAID',
        paid_at: `${month.paid}T12:00:00+03:00`,
        recorded_by: graceId,
      });
    }
  }
  await must('contributions', admin.from('contributions').insert(rows));
}

async function seedSessions(
  admin: Admin,
  chapterId: string,
  cycleId: string,
  memberIds: string[],
  graceId: string,
  danielId: string,
  leadId: string,
): Promise<void> {
  const dates = ['2026-04-09', '2026-05-14', '2026-06-11', '2026-07-09', '2026-08-13', '2026-09-03'];
  const presentCounts = [22, 18, 20, 17, 21, 19];
  for (const [index, date] of dates.entries()) {
    const session = await must(
      'session',
      admin
        .from('mastermind_sessions')
        .insert({
          chapter_id: chapterId,
          held_at: `${date}T07:30:00+03:00`,
          created_by: leadId,
          notes: 'Chapter mastermind',
        })
        .select('id')
        .single(),
    );
    const present = presentCounts[index] ?? memberIds.length;
    await must(
      'attendance',
      admin.from('session_attendance').insert(
        memberIds.map((profileId, i) => ({
          session_id: session.id,
          profile_id: profileId,
          present: i < present,
          late: i < present && i % 11 === 0,
          marked_by: leadId,
        })),
      ),
    );
    if (index >= 3) {
      const open = date === '2026-09-03';
      await must(
        'action',
        admin.from('accountability_actions').insert({
          session_id: session.id,
          chapter_id: chapterId,
          owner_id: graceId,
          partner_id: danielId,
          description: `Follow expired listings after the ${date} session`,
          due_date: `${date.slice(0, 8)}28`,
          status: open ? 'IN_PROGRESS' : 'VERIFIED',
          verified_by: open ? null : danielId,
          verified_at: open ? null : `${date}T18:00:00+03:00`,
          completed_at: open ? null : `${date}T16:00:00+03:00`,
        }),
      );
    }
  }
  const [a, b] = graceId < danielId ? [graceId, danielId] : [danielId, graceId];
  await must(
    'pairing',
    admin.from('pairings').insert({
      chapter_id: chapterId,
      cycle_id: cycleId,
      profile_a: a,
      profile_b: b,
    }),
  );
  const lastSession = await must(
    'last-session',
    admin
      .from('mastermind_sessions')
      .select('id')
      .eq('chapter_id', chapterId)
      .order('held_at', { ascending: false })
      .limit(1)
      .single(),
  );
  await must(
    'daniel-completed',
    admin.from('accountability_actions').insert({
      session_id: lastSession.id,
      chapter_id: chapterId,
      owner_id: danielId,
      partner_id: graceId,
      description: 'Call two expired-listing owners this week',
      due_date: '2026-09-08',
      status: 'COMPLETED',
      completed_at: '2026-09-08T16:00:00+03:00',
    }),
  );
  await must(
    'daniel-overdue',
    admin.from('accountability_actions').insert({
      session_id: lastSession.id,
      chapter_id: chapterId,
      owner_id: danielId,
      partner_id: graceId,
      description: 'Send the Lavington CMA follow-up pack',
      due_date: '2026-09-05',
      status: 'OVERDUE',
    }),
  );
}

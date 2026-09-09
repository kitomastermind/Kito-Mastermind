import type { Admin, IdMap } from './util';
import { must } from './util';

export async function seedLeadsAccessForumPoints(
  admin: Admin,
  chapterId: string,
  cycleId: string,
  areas: IdMap,
  graceId: string,
  amaraId: string,
  kevinId: string,
  danielId: string,
  aminaId: string,
): Promise<void> {
  const leads = await seedLeads(admin, chapterId, areas, graceId, amaraId, kevinId);
  await seedAccess(admin, leads, graceId, amaraId, danielId, kevinId);
  await seedForum(admin, kevinId, graceId, amaraId, danielId, aminaId);
  await seedPoints(admin, cycleId, graceId);
}

async function seedLeads(
  admin: Admin,
  chapterId: string,
  areas: IdMap,
  graceId: string,
  amaraId: string,
  kevinId: string,
): Promise<{ graceBuyer: string; amaraSeller: string; kevinSeller: string }> {
  const lavington = areas['Nairobi:Lavington'];
  const graceBuyer = await must(
    'grace-lead',
    admin
      .from('leads')
      .insert({
        owner_id: graceId,
        chapter_id: chapterId,
        client_name: 'Susan Kamau',
        client_phone: '+254700111001',
        client_email: 'susan.kamau@example.invalid',
        notes: 'Prefers a quiet cul-de-sac',
        lead_type: 'BUYER',
        property_type: 'TOWNHOUSE',
        area_id: lavington,
        budget_min: '2800000000',
        budget_max: '3200000000',
        timeline: 'ONE_TO_THREE_MONTHS',
        source: 'REFERRAL',
        consent_confirmed: true,
      })
      .select('id')
      .single(),
  );
  const amaraSeller = await must(
    'amara-lead',
    admin
      .from('leads')
      .insert({
        owner_id: amaraId,
        chapter_id: chapterId,
        client_name: 'David Kariuki',
        client_phone: '+254700111002',
        client_email: 'david.kariuki@example.invalid',
        notes: 'Ready to list this month',
        lead_type: 'SELLER',
        property_type: 'TOWNHOUSE',
        area_id: lavington,
        budget_min: '2800000000',
        budget_max: '3200000000',
        timeline: 'IMMEDIATE',
        source: 'WEBSITE',
        consent_confirmed: true,
      })
      .select('id')
      .single(),
  );
  const kevinSeller = await must(
    'kevin-lead',
    admin
      .from('leads')
      .insert({
        owner_id: kevinId,
        chapter_id: chapterId,
        client_name: 'Helen Achieng',
        client_phone: '+254700111003',
        client_email: 'helen.achieng@example.invalid',
        notes: 'Apartment near Yaya',
        lead_type: 'SELLER',
        property_type: 'APARTMENT',
        area_id: lavington,
        budget_min: '2200000000',
        budget_max: '2700000000',
        timeline: 'IMMEDIATE',
        source: 'WALK_IN',
        consent_confirmed: true,
      })
      .select('id')
      .single(),
  );
  const pair = (x: string, y: string): [string, string] => (x < y ? [x, y] : [y, x]);
  const [a1, b1] = pair(graceBuyer.id as string, amaraSeller.id as string);
  const [a2, b2] = pair(graceBuyer.id as string, kevinSeller.id as string);
  await must(
    'matches',
    admin.from('lead_matches').insert([
      {
        lead_a_id: a1,
        lead_b_id: b1,
        score: 95,
        matched_facets: [
          { facet: 'AREA', score: 1, label: 'Lavington', kind: 'exact' },
          { facet: 'BUDGET', score: 1, label: '28-32M', kind: 'exact' },
          { facet: 'PROPERTY', score: 1, label: 'Townhouse', kind: 'exact' },
          { facet: 'TIMELINE', score: 0.5, label: '1-3 mo vs Immediate', kind: 'partial' },
        ],
        status: 'ACCESS_GRANTED',
      },
      {
        lead_a_id: a2,
        lead_b_id: b2,
        score: 61,
        matched_facets: [
          { facet: 'AREA', score: 1, label: 'Lavington', kind: 'exact' },
          { facet: 'PROPERTY', score: 0.4, label: 'Townhouse vs Apartment', kind: 'partial' },
        ],
        status: 'PENDING',
      },
    ]),
  );
  return {
    graceBuyer: graceBuyer.id as string,
    amaraSeller: amaraSeller.id as string,
    kevinSeller: kevinSeller.id as string,
  };
}

async function seedAccess(
  admin: Admin,
  leads: { graceBuyer: string; amaraSeller: string; kevinSeller: string },
  graceId: string,
  amaraId: string,
  danielId: string,
  kevinId: string,
): Promise<void> {
  const granted = await must(
    'grant-request',
    admin
      .from('contact_access_requests')
      .insert({
        lead_id: leads.graceBuyer,
        requester_id: amaraId,
        owner_id: graceId,
        message: 'I have a matching seller in Lavington.',
        status: 'APPROVED',
        requested_at: '2026-08-20T09:00:00+03:00',
        responded_at: '2026-08-20T11:00:00+03:00',
        expires_at: '2026-09-03T09:00:00+03:00',
      })
      .select('id')
      .single(),
  );
  await must(
    'grant',
    admin.from('lead_contact_grants').insert({
      lead_id: leads.graceBuyer,
      grantee_id: amaraId,
      grantor_id: graceId,
      request_id: granted.id,
      granted_at: '2026-08-20T11:00:00+03:00',
    }),
  );
  await must(
    'pending-request',
    admin.from('contact_access_requests').insert({
      lead_id: leads.amaraSeller,
      requester_id: graceId,
      owner_id: amaraId,
      message: 'May I introduce my buyer?',
      status: 'PENDING',
      expires_at: '2026-09-23T09:00:00+03:00',
    }),
  );
  await must(
    'denied-request',
    admin.from('contact_access_requests').insert({
      lead_id: leads.kevinSeller,
      requester_id: danielId,
      owner_id: kevinId,
      message: 'Checking fit for a buyer.',
      status: 'DENIED',
      decline_reason: 'Already in exclusive talks',
      requested_at: '2026-08-01T09:00:00+03:00',
      responded_at: '2026-08-01T16:00:00+03:00',
      expires_at: '2026-08-15T09:00:00+03:00',
    }),
  );
}

async function seedForum(
  admin: Admin,
  kevinId: string,
  graceId: string,
  amaraId: string,
  danielId: string,
  aminaId: string,
): Promise<void> {
  const specs = [
    { title: 'Negotiating multiple offers', month: '2026-06-01' },
    { title: 'Pricing land in a rising market', month: '2026-07-01' },
    { title: 'Escalation-clause caps', month: '2026-08-01' },
    { title: 'Keeping sellers calm in a long escrow', month: '2026-09-01' },
  ];
  const topics = [];
  for (const spec of specs) {
    topics.push(
      await must(
        'topic',
        admin
          .from('forum_topics')
          .insert({
            title: spec.title,
            description: `What worked for you on ${spec.title.toLowerCase()}?`,
            month: spec.month,
            chapter_id: null,
            opens_at: `${spec.month}T06:00:00+03:00`,
            voting_closes_at: `${spec.month.slice(0, 8)}28T23:59:00+03:00`,
            created_by: aminaId,
          })
          .select('id')
          .single(),
      ),
    );
  }
  const august = topics[2];
  if (!august) throw new Error('August topic missing');
  const kevinPost = await must(
    'kevin-post',
    admin
      .from('forum_posts')
      .insert({
        topic_id: august.id,
        author_id: kevinId,
        headline: 'Cap the escalation, not the relationship',
        body: 'Put a written ceiling on the escalation clause before you go out. Buyers stay in the deal and sellers still feel the urgency.',
      })
      .select('id')
      .single(),
  );
  await must(
    'other-posts',
    admin.from('forum_posts').insert([
      {
        topic_id: august.id,
        author_id: graceId,
        headline: 'Walk the numbers on paper',
        body: 'I sit with the buyer and write every increment by hand. Seeing the ceiling in ink stops the panic raise.',
      },
      {
        topic_id: august.id,
        author_id: amaraId,
        headline: 'Ask for proof of funds first',
        body: 'I do not open an escalation conversation until funds are documented. It filters theatre from real demand.',
      },
    ]),
  );
  await must(
    'ratings',
    admin.from('forum_ratings').insert([
      { post_id: kevinPost.id, profile_id: graceId, stars: 5 },
      { post_id: kevinPost.id, profile_id: amaraId, stars: 5 },
      { post_id: kevinPost.id, profile_id: danielId, stars: 5 },
      { post_id: kevinPost.id, profile_id: aminaId, stars: 4 },
    ]),
  );
}

async function seedPoints(admin: Admin, cycleId: string, graceId: string): Promise<void> {
  await must(
    'grace-points',
    admin.from('points_entries').insert([
      { profile_id: graceId, cycle_id: cycleId, category: 'ATTENDANCE', points: 100, reason: 'Five sessions attended, one late', source_type: 'SESSION', source_id: graceId },
      { profile_id: graceId, cycle_id: cycleId, category: 'REFERRALS', points: 90, reason: 'Three productive grants you gave', source_type: 'GRANT', source_id: graceId },
      { profile_id: graceId, cycle_id: cycleId, category: 'PRODUCTION', points: 160, reason: 'Closed deal, 80M KES credited', source_type: 'CLOSED_BUSINESS', source_id: graceId },
      { profile_id: graceId, cycle_id: cycleId, category: 'RESPONSE_TIME', points: 90, reason: 'Median first touch under 30 minutes', source_type: 'RESPONSE', source_id: graceId },
      { profile_id: graceId, cycle_id: cycleId, category: 'CONTRIBUTIONS', points: 42, reason: 'On-time dues and one late payment', source_type: 'CONTRIBUTION', source_id: graceId },
    ]),
  );
}

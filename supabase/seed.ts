import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { logger } from '../src/lib/logger';
import { loadLocalEnv, requiredEnv } from './seed/env';
import { assertSeedTargetAllowed } from './seed/guard';
import {
  DEMO_PASSWORD,
  NAIROBI_MEMBERS,
  OTHER_CHAPTER_LEADS,
  type SeedMember,
} from './seed/names';
import { dbQuery } from './seed/sql';

type IdMap = Record<string, string>;

async function must<T>(
  label: string,
  result: PromiseLike<{ data: T; error: { message: string } | null }>,
): Promise<NonNullable<T>> {
  const { data, error } = await result;
  if (error) throw new Error(`${label}: ${error.message}`);
  if (data === null || data === undefined) {
    throw new Error(`${label}: empty result`);
  }
  return data;
}

async function seedChapters(admin: SupabaseClient): Promise<IdMap> {
  const rows = [
    { name: 'Nairobi', code: 'NBO', region: 'Nairobi' },
    { name: 'Mombasa', code: 'MSA', region: 'Coast' },
    { name: 'Kisumu', code: 'KSM', region: 'Nyanza' },
    { name: 'Nakuru', code: 'NKR', region: 'Rift Valley' },
  ];
  const data = await must(
    'chapters',
    admin.from('chapters').insert(rows).select('id, code'),
  );
  return Object.fromEntries((data ?? []).map((r) => [r.code as string, r.id as string]));
}

async function seedAreas(admin: SupabaseClient): Promise<IdMap> {
  const cities: Record<string, { parent: string; children: string[] }[]> = {
    Nairobi: [
      { parent: 'Westlands', children: ['Lavington', 'Kileleshwa', 'Riverside'] },
      { parent: 'Kilimani', children: ['Kilimani', 'Yaya'] },
    ],
    Mombasa: [
      { parent: 'Nyali', children: ['Nyali', 'Bamburi'] },
      { parent: 'Mombasa CBD', children: ['Tudor', 'Kizingo'] },
    ],
    Kisumu: [
      { parent: 'Milimani', children: ['Milimani', 'Riat'] },
      { parent: 'Kisumu CBD', children: ['Nyalenda', 'Kondele'] },
    ],
    Nakuru: [
      { parent: 'Milimani Nakuru', children: ['Section 58', 'Naka'] },
      { parent: 'Nakuru CBD', children: ['Lanet', 'Pipeline'] },
    ],
  };
  const ids: IdMap = {};
  for (const [city, groups] of Object.entries(cities)) {
    for (const group of groups) {
      const parent = await must(
        'area-parent',
        admin
          .from('areas')
          .insert({ city, name: group.parent })
          .select('id')
          .single(),
      );
      ids[`${city}:${group.parent}`] = parent.id as string;
      for (const child of group.children) {
        if (child === group.parent) {
          ids[`${city}:${child}`] = parent.id as string;
          continue;
        }
        const row = await must(
          'area-child',
          admin
            .from('areas')
            .insert({ city, name: child, parent_id: parent.id })
            .select('id')
            .single(),
        );
        ids[`${city}:${child}`] = row.id as string;
      }
    }
  }
  return ids;
}

async function seedCycles(admin: SupabaseClient, chapters: IdMap): Promise<IdMap> {
  const defs = [
    { name: 'Q1 2026', start_date: '2026-01-01', end_date: '2026-03-31' },
    { name: 'Q2 2026', start_date: '2026-04-01', end_date: '2026-06-30' },
    { name: 'Q3 2026', start_date: '2026-07-01', end_date: '2026-09-30' },
  ];
  const ids: IdMap = {};
  for (const [code, chapterId] of Object.entries(chapters)) {
    for (const def of defs) {
      const row = await must(
        'cycle',
        admin
          .from('cycles')
          .insert({ chapter_id: chapterId, ...def, points_cap: 600 })
          .select('id')
          .single(),
      );
      ids[`${code}:${def.name}`] = row.id as string;
    }
  }
  return ids;
}

async function seedPointsConfig(admin: SupabaseClient): Promise<void> {
  const caps = [
    { category: 'ATTENDANCE', cap: 120, params: { per_session: 20, late_penalty: 5 } },
    { category: 'REFERRALS', cap: 150, params: { per_productive_grant: 30 } },
    { category: 'PRODUCTION', cap: 180, params: { kes_per_point: 500000 } },
    { category: 'RESPONSE_TIME', cap: 90, params: { grades: { A: 90, B: 65, C: 40, D: 15, F: 0 } } },
    { category: 'CONTRIBUTIONS', cap: 60, params: { on_time: 10, late: 5 } },
  ];
  await must('points_config', admin.from('points_config').insert(caps).select('id'));
}

async function seedMembers(
  admin: SupabaseClient,
  chapters: IdMap,
  members: SeedMember[],
): Promise<IdMap> {
  const ids: IdMap = {};
  dbQuery('alter table auth.users disable trigger on_auth_user_created;');
  try {
    for (const member of members) {
      const created = await admin.auth.admin.createUser({
        email: member.email,
        password: DEMO_PASSWORD,
        email_confirm: true,
        user_metadata: { full_name: member.fullName },
      });
      if (created.error || !created.data.user) {
        throw new Error(`auth ${member.email}: ${created.error?.message ?? 'no user'}`);
      }
      const id = created.data.user.id;
      const chapterId = chapters[member.chapterCode];
      if (!chapterId) throw new Error(`Unknown chapter ${member.chapterCode}`);
      await must(
        `profile ${member.email}`,
        admin.from('profiles').insert({
          id,
          email: member.email,
          full_name: member.fullName,
          phone: member.phone,
          brokerage: member.brokerage,
          chapter_id: chapterId,
          role: member.role,
          agreement_version: '2026-01',
          agreement_accepted_at: '2026-01-15T09:00:00+03:00',
        }).select('id').single(),
      );
      await must(
        `prefs ${member.email}`,
        admin.from('notification_preferences').insert({ profile_id: id }).select('profile_id').single(),
      );
      ids[member.email] = id;
    }
  } finally {
    dbQuery('alter table auth.users enable trigger on_auth_user_created;');
  }
  return ids;
}

async function seedDomain(
  admin: SupabaseClient,
  chapters: IdMap,
  areas: IdMap,
  cycles: IdMap,
  people: IdMap,
): Promise<void> {
  const { seedDemoDomain } = await import('./seed/demo-domain');
  await seedDemoDomain(admin, chapters, areas, cycles, people);
}

async function main(): Promise<void> {
  loadLocalEnv();
  const dbUrl = requiredEnv('SUPABASE_DB_URL');
  assertSeedTargetAllowed(dbUrl, process.env.ALLOW_REMOTE_SEED === 'true');

  const admin = createClient(requiredEnv('NEXT_PUBLIC_SUPABASE_URL'), requiredEnv('SUPABASE_SERVICE_ROLE_KEY'), {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const chapters = await seedChapters(admin);
  const areas = await seedAreas(admin);
  const cycles = await seedCycles(admin, chapters);
  await seedPointsConfig(admin);
  const people = await seedMembers(admin, chapters, [...NAIROBI_MEMBERS, ...OTHER_CHAPTER_LEADS]);
  await seedDomain(admin, chapters, areas, cycles, people);
  logger.info('seed-complete', { members: Object.keys(people).length });
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : 'Unknown seed error';
  logger.error('seed-failed', { error: message });
  process.exitCode = 1;
});

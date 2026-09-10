import { createClient } from '@supabase/supabase-js';
import { execFileSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { logger } from '../src/lib/logger';
import type { Database } from '../src/lib/types/database';

function loadEnvFile(name: string): void {
  let text = '';
  try {
    text = readFileSync(resolve(process.cwd(), name), 'utf8');
  } catch {
    return;
  }
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq < 1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}

function linkedQuery(sql: string): void {
  const bin =
    process.platform === 'win32'
      ? join(process.cwd(), 'node_modules', '.bin', 'supabase.cmd')
      : join(process.cwd(), 'node_modules', '.bin', 'supabase');
  execFileSync(bin, ['db', 'query', '--linked', '--yes', sql], { stdio: 'inherit' });
}

const CHAPTERS: { name: string; code: string; region: string }[] = [
  { name: 'Nairobi', code: 'NBO', region: 'Nairobi' },
  { name: 'Mombasa', code: 'MSA', region: 'Coast' },
  { name: 'Kisumu', code: 'KSM', region: 'Nyanza' },
  { name: 'Nakuru', code: 'NKR', region: 'Rift Valley' },
];

const NAIROBI_AREAS: { parent: string; children: string[] }[] = [
  { parent: 'Westlands', children: ['Lavington', 'Kileleshwa', 'Riverside'] },
  { parent: 'Kilimani', children: ['Kilimani', 'Yaya'] },
  { parent: 'Karen', children: ['Karen', 'Langata'] },
];

const POINT_CAPS: {
  category: Database['public']['Enums']['points_category'];
  cap: number;
  params: Record<string, unknown>;
}[] = [
  { category: 'ATTENDANCE', cap: 120, params: { per_session: 20, late_penalty: 5 } },
  { category: 'REFERRALS', cap: 150, params: { per_productive_grant: 30 } },
  { category: 'PRODUCTION', cap: 180, params: { kes_per_point: 500000 } },
  { category: 'RESPONSE_TIME', cap: 90, params: { grades: { A: 90, B: 65, C: 40, D: 15, F: 0 } } },
  { category: 'CONTRIBUTIONS', cap: 60, params: { on_time: 10, late: 5 } },
];

async function main(): Promise<void> {
  loadEnvFile('.env.production.local');
  loadEnvFile('.env.local');

  const url = required('NEXT_PUBLIC_SUPABASE_URL');
  if (!url.includes('supabase.co')) {
    throw new Error('bootstrap-live only runs against a hosted supabase.co project');
  }

  const admin = createClient(url, required('SUPABASE_SERVICE_ROLE_KEY'), {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const bucket = process.env.SUPABASE_STORAGE_BUCKET ?? 'kito-files';
  const { data: buckets, error: bucketListError } = await admin.storage.listBuckets();
  if (bucketListError) throw new Error(bucketListError.message);
  if (!buckets?.some((row) => row.name === bucket)) {
    const createdBucket = await admin.storage.createBucket(bucket, {
      public: false,
      fileSizeLimit: 10485760,
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'text/csv'],
    });
    if (createdBucket.error) throw new Error(createdBucket.error.message);
  }

  for (const chapter of CHAPTERS) {
    const { error } = await admin.from('chapters').upsert(chapter, { onConflict: 'code' });
    if (error) throw new Error(`chapter ${chapter.code}: ${error.message}`);
  }

  const { data: nairobi, error: nairobiError } = await admin
    .from('chapters')
    .select('id')
    .eq('code', 'NBO')
    .single();
  if (nairobiError || !nairobi) throw new Error(nairobiError?.message ?? 'Nairobi chapter missing');

  for (const group of NAIROBI_AREAS) {
    const { data: parent } = await admin
      .from('areas')
      .select('id')
      .eq('city', 'Nairobi')
      .eq('name', group.parent)
      .maybeSingle();
    let parentId = parent?.id;
    if (!parentId) {
      const inserted = await admin
        .from('areas')
        .insert({ city: 'Nairobi', name: group.parent })
        .select('id')
        .single();
      if (inserted.error || !inserted.data) {
        throw new Error(inserted.error?.message ?? 'Could not create area');
      }
      parentId = inserted.data.id;
    }
    for (const child of group.children) {
      if (child === group.parent) continue;
      const { data: existing } = await admin
        .from('areas')
        .select('id')
        .eq('city', 'Nairobi')
        .eq('name', child)
        .maybeSingle();
      if (existing) continue;
      const { error } = await admin.from('areas').insert({
        city: 'Nairobi',
        name: child,
        parent_id: parentId,
      });
      if (error) throw new Error(`area ${child}: ${error.message}`);
    }
  }

  const cycles = [
    { name: 'Q3 2026', start_date: '2026-07-01', end_date: '2026-09-30' },
    { name: 'Q4 2026', start_date: '2026-10-01', end_date: '2026-12-31' },
  ];
  for (const cycle of cycles) {
    const { data: existing } = await admin
      .from('cycles')
      .select('id')
      .eq('chapter_id', nairobi.id)
      .eq('name', cycle.name)
      .maybeSingle();
    if (existing) continue;
    const { error } = await admin.from('cycles').insert({
      chapter_id: nairobi.id,
      ...cycle,
      points_cap: 600,
    });
    if (error) throw new Error(`cycle ${cycle.name}: ${error.message}`);
  }

  for (const cap of POINT_CAPS) {
    const { data: existing } = await admin
      .from('points_config')
      .select('id')
      .is('chapter_id', null)
      .eq('category', cap.category)
      .maybeSingle();
    if (existing) continue;
    const { error } = await admin.from('points_config').insert({
      chapter_id: null,
      category: cap.category,
      cap: cap.cap,
      params: cap.params,
    });
    if (error) throw new Error(`points ${cap.category}: ${error.message}`);
  }

  const adminEmail = process.env.FIRST_ADMIN_EMAIL?.trim().toLowerCase();
  if (!adminEmail) {
    logger.info('live-bootstrap-org-only', { reason: 'FIRST_ADMIN_EMAIL is empty' });
    return;
  }

  const { data: already } = await admin.from('profiles').select('id').eq('email', adminEmail).maybeSingle();
  if (already) {
    logger.info('live-bootstrap-admin-exists', { email: adminEmail });
    return;
  }

  const password =
    process.env.FIRST_ADMIN_PASSWORD && process.env.FIRST_ADMIN_PASSWORD.length >= 12
      ? process.env.FIRST_ADMIN_PASSWORD
      : `Kito-${randomBytes(9).toString('base64url')}`;
  const fullName = process.env.FIRST_ADMIN_NAME?.trim() || 'KITO Admin';

  linkedQuery('alter table auth.users disable trigger on_auth_user_created;');
  try {
    const created = await admin.auth.admin.createUser({
      email: adminEmail,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });
    if (created.error || !created.data.user) {
      throw new Error(created.error?.message ?? 'Could not create the first admin');
    }
    const { error: profileError } = await admin.from('profiles').insert({
      id: created.data.user.id,
      email: adminEmail,
      full_name: fullName,
      chapter_id: nairobi.id,
      role: 'ADMIN',
      agreement_version: '2026-01',
      agreement_accepted_at: new Date().toISOString(),
    });
    if (profileError) throw new Error(profileError.message);
    const { error: prefError } = await admin
      .from('notification_preferences')
      .insert({ profile_id: created.data.user.id });
    if (prefError) throw new Error(prefError.message);
    logger.info('live-bootstrap-admin-created', { email: adminEmail });
    if (!process.env.FIRST_ADMIN_PASSWORD) {
      logger.info('live-bootstrap-admin-password', { password });
    }
  } finally {
    linkedQuery('alter table auth.users enable trigger on_auth_user_created;');
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : 'Unknown bootstrap error';
  logger.error('live-bootstrap-failed', { error: message });
  process.exitCode = 1;
});

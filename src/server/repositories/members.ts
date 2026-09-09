import type { Actor } from '@/server/policy';
import { createClient } from '@/server/supabase/server';

export async function listChapterMembers(actor: Actor) {
  const supabase = await createClient();
  let query = supabase
    .from('profiles')
    .select('id, full_name, email, role, active, chapter_id, chapters(name)')
    .order('full_name');
  if (actor.role !== 'ADMIN') query = query.eq('chapter_id', actor.chapterId);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.full_name,
    email: row.email,
    role: row.role,
    active: row.active,
    chapterId: row.chapter_id,
    chapterName:
      row.chapters && typeof row.chapters === 'object' && 'name' in row.chapters
        ? String(row.chapters.name)
        : 'Chapter',
  }));
}

export async function listOpenInvitations(actor: Actor) {
  const supabase = await createClient();
  let query = supabase
    .from('invitations')
    .select('id, email, role, expires_at, chapter_id')
    .is('accepted_at', null)
    .is('revoked_at', null)
    .order('created_at', { ascending: false });
  if (actor.role !== 'ADMIN') query = query.eq('chapter_id', actor.chapterId);
  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

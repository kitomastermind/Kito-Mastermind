import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/types/database';
import { logger } from '@/lib/logger';
import type { Actor } from '@/server/policy';

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not set`);
  }
  return value;
}

export async function createClient(): Promise<SupabaseClient<Database>> {
  const cookieStore = await cookies();
  return createServerClient<Database>(
    required('NEXT_PUBLIC_SUPABASE_URL'),
    required('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            logger.debug('cookie-set-skipped', {
              reason: 'server-component-readonly',
            });
          }
        },
      },
    },
  );
}

export async function getActor(): Promise<Actor | null> {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return null;

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id, chapter_id, role, active, full_name')
    .eq('id', auth.user.id)
    .maybeSingle();

  if (error) {
    throw error;
  }
  if (!profile) return null;

  return {
    id: profile.id,
    chapterId: profile.chapter_id,
    role: profile.role,
    active: profile.active,
    fullName: profile.full_name,
  };
}

export async function requireActor(): Promise<Actor> {
  const actor = await getActor();
  if (!actor) {
    redirect('/login');
  }
  if (!actor.active) {
    redirect('/inactive');
  }
  return actor;
}

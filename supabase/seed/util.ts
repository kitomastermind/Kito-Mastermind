import type { SupabaseClient } from '@supabase/supabase-js';

export type IdMap = Record<string, string>;

export async function must<T>(
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

export function requireId(map: IdMap, key: string): string {
  const value = map[key];
  if (!value) throw new Error(`Missing seed id ${key}`);
  return value;
}

export type Admin = SupabaseClient;

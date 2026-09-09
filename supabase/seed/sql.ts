import { execFileSync } from 'node:child_process';

const CONTAINER = 'supabase_db_kito-mastermind';

export function dbQuery(sql: string): string {
  return execFileSync(
    'docker',
    ['exec', CONTAINER, 'psql', '-U', 'supabase_admin', '-d', 'postgres', '-v', 'ON_ERROR_STOP=1', '-c', sql],
    { encoding: 'utf8' },
  );
}

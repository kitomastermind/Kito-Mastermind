import { describe, expect, it } from 'vitest';
import { assertSeedTargetAllowed } from '../../supabase/seed/guard';

describe('assertSeedTargetAllowed', () => {
  it('allows a local database URL', () => {
    expect(() =>
      assertSeedTargetAllowed('postgresql://postgres:postgres@127.0.0.1:54322/postgres', false),
    ).not.toThrow();
  });

  it('blocks a hosted supabase.co URL unless explicitly allowed', () => {
    expect(() =>
      assertSeedTargetAllowed('postgresql://postgres.abc@db.xxx.supabase.co:5432/postgres', false),
    ).toThrow(/ALLOW_REMOTE_SEED/);
  });

  it('allows a hosted URL when ALLOW_REMOTE_SEED is true', () => {
    expect(() =>
      assertSeedTargetAllowed('postgresql://postgres.abc@db.xxx.supabase.co:5432/postgres', true),
    ).not.toThrow();
  });
});

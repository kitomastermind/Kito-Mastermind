export function assertSeedTargetAllowed(
  dbUrl: string,
  allowRemote: boolean,
): void {
  if (dbUrl.includes('supabase.co') && !allowRemote) {
    throw new Error(
      'Refusing to seed a remote Supabase project. Set ALLOW_REMOTE_SEED=true to override.',
    );
  }
}

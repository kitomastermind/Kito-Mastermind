create table public.mastermind_sessions (
  id         uuid primary key default gen_random_uuid(),
  chapter_id uuid not null references public.chapters(id) on delete cascade,
  held_at    timestamptz not null,
  topic_id   uuid,                                -- FK added in migration 005
  notes      text,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);
create index sessions_chapter_idx on public.mastermind_sessions (chapter_id, held_at desc);

create table public.session_attendance (
  id          uuid primary key default gen_random_uuid(),
  session_id  uuid not null references public.mastermind_sessions(id) on delete cascade,
  profile_id  uuid not null references public.profiles(id) on delete cascade,
  present     boolean not null default true,
  late        boolean not null default false,
  marked_by   uuid not null references public.profiles(id),
  marked_at   timestamptz not null default now(),
  unique (session_id, profile_id)
);

create table public.pairings (
  id         uuid primary key default gen_random_uuid(),
  chapter_id uuid not null references public.chapters(id) on delete cascade,
  cycle_id   uuid not null references public.cycles(id) on delete cascade,
  profile_a  uuid not null references public.profiles(id) on delete cascade,
  profile_b  uuid not null references public.profiles(id) on delete cascade,
  started_at timestamptz not null default now(),
  ended_at   timestamptz,
  check (profile_a < profile_b)
);
create index pairings_active_idx on public.pairings (chapter_id, cycle_id) where ended_at is null;
create index pairings_a_idx on public.pairings (profile_a) where ended_at is null;
create index pairings_b_idx on public.pairings (profile_b) where ended_at is null;

create table public.accountability_actions (
  id           uuid primary key default gen_random_uuid(),
  session_id   uuid references public.mastermind_sessions(id) on delete set null,
  chapter_id   uuid not null references public.chapters(id),
  owner_id     uuid not null references public.profiles(id) on delete cascade,
  partner_id   uuid references public.profiles(id) on delete set null,
  description  text not null,
  due_date     date not null,
  status       action_status not null default 'NOT_STARTED',
  completed_at timestamptz,
  verified_by  uuid references public.profiles(id),
  verified_at  timestamptz,
  nudged_at    timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),

  check (char_length(description) between 3 and 300),
  -- an owner can never be their own verifier. Enforced here AND in policy.ts.
  check (verified_by is null or verified_by <> owner_id)
);

create index actions_owner_idx   on public.accountability_actions (owner_id, status, due_date);
create index actions_partner_idx on public.accountability_actions (partner_id, status);

create trigger actions_touch before update on public.accountability_actions
  for each row execute function public.touch_updated_at();

-- a member may request re-pairing; a human decides
create table public.pairing_requests (
  id          uuid primary key default gen_random_uuid(),
  profile_id  uuid not null references public.profiles(id) on delete cascade,
  chapter_id  uuid not null references public.chapters(id) on delete cascade,
  reason      text,
  resolved_at timestamptz,
  created_at  timestamptz not null default now()
);

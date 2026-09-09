-- Rate-limit counters. Written only by the service role.

create table public.rate_limits (
  profile_id        uuid not null references public.profiles(id) on delete cascade,
  action            text not null,
  window_started_at timestamptz not null,
  hit_count         integer not null default 1,
  primary key (profile_id, action)
);

alter table public.rate_limits enable row level security;

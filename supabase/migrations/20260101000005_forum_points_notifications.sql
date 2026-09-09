create table public.forum_topics (
  id               uuid primary key default gen_random_uuid(),
  title            text not null,
  description      text not null,
  month            date not null,                 -- first day of the month
  chapter_id       uuid references public.chapters(id) on delete cascade,  -- null = network wide
  opens_at         timestamptz not null,
  voting_closes_at timestamptz not null,
  created_by       uuid not null references public.profiles(id),
  created_at       timestamptz not null default now(),
  check (voting_closes_at > opens_at)
);
create index forum_topics_month_idx on public.forum_topics (month desc);

alter table public.mastermind_sessions
  add constraint sessions_topic_fk
  foreign key (topic_id) references public.forum_topics(id) on delete set null;

create table public.forum_posts (
  id         uuid primary key default gen_random_uuid(),
  topic_id   uuid not null references public.forum_topics(id) on delete cascade,
  author_id  uuid not null references public.profiles(id) on delete cascade,
  headline   text not null,
  body       text not null,
  created_at timestamptz not null default now(),
  edited_at  timestamptz,
  hidden_at  timestamptz,
  hidden_by  uuid references public.profiles(id),
  check (char_length(headline) between 5 and 120),
  check (char_length(body) between 20 and 4000),
  unique (topic_id, author_id)                    -- one lesson per member per topic
);
create index forum_posts_topic_idx on public.forum_posts (topic_id, created_at desc);

create table public.forum_replies (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid not null references public.forum_posts(id) on delete cascade,
  author_id  uuid not null references public.profiles(id) on delete cascade,
  body       text not null,
  created_at timestamptz not null default now(),
  hidden_at  timestamptz,
  check (char_length(body) between 1 and 2000)
);
create index forum_replies_post_idx on public.forum_replies (post_id, created_at);

create table public.forum_ratings (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid not null references public.forum_posts(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  stars      smallint not null check (stars between 1 and 5),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (post_id, profile_id)                    -- one vote per member per post
);

create trigger forum_ratings_touch before update on public.forum_ratings
  for each row execute function public.touch_updated_at();

-- ---------- points ----------

create table public.points_config (
  id         uuid primary key default gen_random_uuid(),
  chapter_id uuid references public.chapters(id) on delete cascade,   -- null = global default
  category   points_category not null,
  cap        integer not null,
  params     jsonb not null default '{}'::jsonb,
  unique (chapter_id, category)
);

create table public.points_entries (
  id          uuid primary key default gen_random_uuid(),
  profile_id  uuid not null references public.profiles(id) on delete cascade,
  cycle_id    uuid not null references public.cycles(id) on delete cascade,
  category    points_category not null,
  points      integer not null,
  reason      text not null,                      -- shown to the member verbatim
  source_type text not null,
  source_id   uuid,
  awarded_at  timestamptz not null default now(),
  -- makes the nightly recompute idempotent
  unique (profile_id, cycle_id, category, source_type, source_id)
);
create index points_member_cycle_idx on public.points_entries (profile_id, cycle_id);

-- ---------- notifications ----------

create table public.notifications (
  id         uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  type       notification_type not null,
  title      text not null,
  body       text not null,   -- MUST NOT contain another member's client PII
  link_path  text,
  read_at    timestamptz,
  emailed_at timestamptz,
  created_at timestamptz not null default now()
);
create index notifications_inbox_idx on public.notifications (profile_id, read_at, created_at desc);

create table public.notification_preferences (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  email_immediate notification_type[] not null default
    '{ACCESS_REQUESTED,ACCESS_GRANTED,VERIFICATION_NEEDED,NUDGE,MATCH_MESSAGE,DEAL_CONFIRMATION_NEEDED}',
  email_digest    boolean not null default true,
  updated_at      timestamptz not null default now()
);

-- ---------- CRM connections ----------

create table public.crm_connections (
  id                 uuid primary key default gen_random_uuid(),
  profile_id         uuid not null references public.profiles(id) on delete cascade,
  provider           crm_provider not null,
  access_token_enc   text not null,               -- encrypted at rest, NEVER returned to any client
  refresh_token_enc  text,
  connected          boolean not null default false,
  connected_at       timestamptz,
  unique (profile_id, provider)
);

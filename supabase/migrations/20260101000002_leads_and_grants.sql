-- ============================================================
-- KITO Mastermind :: 002 :: leads, matching, contact access
-- ============================================================

create table public.leads (
  id             uuid primary key default gen_random_uuid(),
  owner_id       uuid not null references public.profiles(id) on delete restrict,
  chapter_id     uuid not null references public.chapters(id),

  -- ===== PROTECTED COLUMNS. Unreachable without ownership or an active grant. =====
  client_name    text not null,
  client_phone   text not null,
  client_email   text,
  notes          text,
  -- ==============================================================================

  lead_type      lead_type not null,
  property_type  property_type,
  area_id        uuid references public.areas(id),
  area_free_text text,
  budget_min     bigint,                          -- KES CENTS
  budget_max     bigint,                          -- KES CENTS
  timeline       lead_timeline,
  source         lead_source,
  status         lead_status not null default 'NEW',

  consent_confirmed boolean not null default false,   -- Kenya DPA 2019
  crm_sync_target   crm_provider not null default 'NONE',
  crm_external_id   text,

  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  first_touch_at timestamptz,
  closed_at      timestamptz,
  pii_purged_at  timestamptz,

  check (budget_min is null or budget_min >= 0),
  check (budget_max is null or budget_min is null or budget_max >= budget_min),
  check (area_id is not null or area_free_text is not null)
);

create index leads_pool_idx    on public.leads (chapter_id, status, lead_type);
create index leads_owner_idx   on public.leads (owner_id, created_at desc);
create index leads_area_idx    on public.leads (area_id);
create index leads_budget_idx  on public.leads (budget_min, budget_max);

create trigger leads_touch before update on public.leads
  for each row execute function public.touch_updated_at();

-- ---------- lead activity (drives the response-time metric) ----------

create table public.lead_activity (
  id          bigserial primary key,
  lead_id     uuid not null references public.leads(id) on delete cascade,
  actor_id    uuid not null references public.profiles(id),
  kind        text not null,                      -- FIRST_TOUCH | STATUS_CHANGE | NOTE_ADDED | CONTACT_VIEWED
  from_status lead_status,
  to_status   lead_status,
  occurred_at timestamptz not null default now()
);

create index lead_activity_lead_idx on public.lead_activity (lead_id, occurred_at desc);
create index lead_activity_actor_idx on public.lead_activity (actor_id, kind, occurred_at desc);

-- ---------- matches ----------

create table public.lead_matches (
  id             uuid primary key default gen_random_uuid(),
  lead_a_id      uuid not null references public.leads(id) on delete cascade,
  lead_b_id      uuid not null references public.leads(id) on delete cascade,
  score          smallint not null,
  matched_facets jsonb not null default '[]'::jsonb,
  status         match_status not null default 'PENDING',
  created_at     timestamptz not null default now(),

  check (score between 0 and 100),
  check (lead_a_id < lead_b_id),                  -- canonical ordering, no duplicate pairs
  unique (lead_a_id, lead_b_id)
);

create index lead_matches_a_idx on public.lead_matches (lead_a_id, score desc);
create index lead_matches_b_idx on public.lead_matches (lead_b_id, score desc);

-- ---------- contact access requests ----------

create table public.contact_access_requests (
  id            uuid primary key default gen_random_uuid(),
  lead_id       uuid not null references public.leads(id) on delete cascade,
  match_id      uuid references public.lead_matches(id) on delete set null,
  requester_id  uuid not null references public.profiles(id) on delete cascade,
  owner_id      uuid not null references public.profiles(id) on delete cascade,
  message       text,
  status        request_status not null default 'PENDING',
  decline_reason text,                            -- never shown to the requester
  requested_at  timestamptz not null default now(),
  responded_at  timestamptz,
  expires_at    timestamptz not null,

  check (requester_id <> owner_id),
  check (message is null or char_length(message) <= 500)
);

-- at most one OPEN request per (lead, requester)
create unique index car_one_open_idx
  on public.contact_access_requests (lead_id, requester_id)
  where status = 'PENDING';

create index car_owner_idx on public.contact_access_requests (owner_id, status, requested_at desc);
create index car_requester_idx on public.contact_access_requests (requester_id, status);

-- ---------- grants: THE single source of truth for contact access ----------
-- There is no denormalised copy of this anywhere in the system.

create table public.lead_contact_grants (
  id             uuid primary key default gen_random_uuid(),
  lead_id        uuid not null references public.leads(id) on delete cascade,
  grantee_id     uuid not null references public.profiles(id) on delete cascade,
  grantor_id     uuid not null references public.profiles(id) on delete cascade,
  request_id     uuid unique references public.contact_access_requests(id) on delete set null,
  granted_at     timestamptz not null default now(),
  expires_at     timestamptz,                     -- null = until revoked
  revoked_at     timestamptz,
  revoked_reason text,
  last_viewed_at timestamptz,

  check (grantee_id <> grantor_id),
  unique (lead_id, grantee_id)
);

create index grants_active_idx
  on public.lead_contact_grants (grantee_id, lead_id)
  where revoked_at is null;

-- ---------- match threads ----------

create table public.match_threads (
  id         uuid primary key default gen_random_uuid(),
  match_id   uuid not null unique references public.lead_matches(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.match_messages (
  id         uuid primary key default gen_random_uuid(),
  thread_id  uuid not null references public.match_threads(id) on delete cascade,
  author_id  uuid not null references public.profiles(id) on delete cascade,
  body       text not null,
  sent_at    timestamptz not null default now(),
  read_at    timestamptz,
  check (char_length(body) between 1 and 2000)
);

create index match_messages_thread_idx on public.match_messages (thread_id, sent_at);

-- ---------- closed business ----------

create table public.closed_business (
  id           uuid primary key default gen_random_uuid(),
  lead_id      uuid references public.leads(id) on delete set null,
  chapter_id   uuid not null references public.chapters(id),
  sale_volume  bigint not null,                   -- KES CENTS
  closed_at    date not null,
  created_by   uuid not null references public.profiles(id),
  verified_by  uuid references public.profiles(id),
  verified_at  timestamptz,
  created_at   timestamptz not null default now(),
  check (sale_volume > 0)
);

create index closed_business_chapter_idx on public.closed_business (chapter_id, closed_at desc);

create table public.closed_business_participants (
  id                 uuid primary key default gen_random_uuid(),
  closed_business_id uuid not null references public.closed_business(id) on delete cascade,
  profile_id         uuid not null references public.profiles(id) on delete cascade,
  participant_role   text not null,               -- REFERRER | CLOSER
  credit_share       smallint not null,           -- percent
  confirmed_at       timestamptz,
  unique (closed_business_id, profile_id),
  check (credit_share between 0 and 100)
);

-- credit shares must total 100 before verification. Enforced in migration 009.

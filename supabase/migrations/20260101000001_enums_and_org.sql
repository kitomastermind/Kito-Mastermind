-- ============================================================
-- KITO Mastermind :: 001 :: enums and organisation
-- ============================================================

create extension if not exists "pgcrypto";
create extension if not exists "pg_trgm";      -- fuzzy area matching

-- ---------- enums ----------

create type app_role          as enum ('MEMBER','TREASURER','CHAPTER_LEAD','ADMIN');
create type lead_type         as enum ('BUYER','SELLER','RENTAL_SEEKER','RENTAL_LISTER');
create type property_type     as enum ('APARTMENT','TOWNHOUSE','STANDALONE_HOUSE','LAND');
create type lead_timeline     as enum ('IMMEDIATE','ONE_TO_THREE_MONTHS','THREE_TO_SIX_MONTHS','BROWSING');
create type lead_source       as enum ('REFERRAL','WEBSITE','WALK_IN','SOCIAL_MEDIA','MEMBER_REFERRAL');
create type lead_status       as enum ('NEW','CONTACTED','QUALIFIED','UNDER_CONTRACT','CLOSED','LOST');
create type contribution_type as enum ('DUES','FINE','EVENT_FEE','DONATION');
create type payment_method    as enum ('MPESA','CASH','BANK_TRANSFER');
create type payment_status    as enum ('PENDING','PAID','FAILED','REVERSED');
create type action_status     as enum ('NOT_STARTED','IN_PROGRESS','COMPLETED','VERIFIED','OVERDUE');
create type match_status      as enum ('PENDING','ACCESS_REQUESTED','ACCESS_GRANTED','DECLINED','CLOSED');
create type request_status    as enum ('PENDING','APPROVED','DENIED','EXPIRED','REVOKED');
create type crm_provider      as enum ('NONE','FOLLOW_UP_BOSS','HUBSPOT','KVCORE','ZOHO');
create type points_category   as enum ('ATTENDANCE','REFERRALS','CONTRIBUTIONS','RESPONSE_TIME','PRODUCTION');

create type notification_type as enum (
  'LEAD_MATCH','ACCESS_REQUESTED','ACCESS_GRANTED','ACCESS_DENIED','ACCESS_REVOKED',
  'ACCOUNTABILITY_DUE','ACCOUNTABILITY_OVERDUE','VERIFICATION_NEEDED','ACTION_VERIFIED','NUDGE',
  'CONTRIBUTION_DUE','CONTRIBUTION_RECEIVED','FORUM_TOPIC_OPENED','FORUM_REPLY',
  'MATCH_MESSAGE','DEAL_CONFIRMATION_NEEDED','POINTS_AWARDED'
);

create type audit_action as enum (
  'GRANT_CREATED','GRANT_REVOKED','ACCESS_REQUESTED','ACCESS_APPROVED','ACCESS_DENIED',
  'LEAD_CONTACT_VIEWED','LEAD_CREATED','LEAD_DELETED',
  'ROLE_CHANGED','MEMBER_INVITED','MEMBER_ACCEPTED','MEMBER_DEACTIVATED','MEMBER_REACTIVATED',
  'CONTRIBUTION_RECORDED','CONTRIBUTION_VOIDED','PAYMENT_ALLOCATED',
  'STATEMENT_GENERATED','FORUM_POST_HIDDEN','DEAL_VERIFIED','THREAD_CREATED'
);

-- ---------- chapters ----------

create table public.chapters (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,
  code        text not null unique,               -- 'NBO', used in M-Pesa refs
  region      text,
  timezone    text not null default 'Africa/Nairobi',
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

-- ---------- profiles (1:1 with auth.users) ----------

create table public.profiles (
  id                uuid primary key references auth.users(id) on delete cascade,
  email             text not null unique,
  full_name         text not null,
  phone             text,
  brokerage         text,
  profile_photo_url text,
  chapter_id        uuid not null references public.chapters(id),
  role              app_role not null default 'MEMBER',
  active            boolean not null default true,
  agreement_version text,
  agreement_accepted_at timestamptz,
  joined_at         timestamptz not null default now(),
  last_seen_at      timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
-- NOTHING SENSITIVE LIVES HERE. No CRM tokens. No cached point totals.

create index profiles_chapter_active_idx on public.profiles (chapter_id, active);

-- ---------- invitations ----------

create table public.invitations (
  id           uuid primary key default gen_random_uuid(),
  email        text not null,
  chapter_id   uuid not null references public.chapters(id),
  role         app_role not null default 'MEMBER',
  token_hash   text not null unique,              -- sha256 of the raw token
  invited_by   uuid not null references public.profiles(id),
  expires_at   timestamptz not null,
  accepted_at  timestamptz,
  revoked_at   timestamptz,
  created_at   timestamptz not null default now()
);

create index invitations_email_idx on public.invitations (lower(email));

-- ---------- cycles ----------

create table public.cycles (
  id          uuid primary key default gen_random_uuid(),
  chapter_id  uuid not null references public.chapters(id) on delete cascade,
  name        text not null,                      -- 'Q3 2026'
  start_date  date not null,
  end_date    date not null,
  points_cap  integer not null default 600,
  created_at  timestamptz not null default now(),
  unique (chapter_id, name),
  check (end_date > start_date)
);

create index cycles_chapter_range_idx on public.cycles (chapter_id, start_date, end_date);

-- one active cycle per chapter at a time
create unique index cycles_no_overlap_idx
  on public.cycles (chapter_id, start_date);

-- ---------- areas ----------

create table public.areas (
  id         uuid primary key default gen_random_uuid(),
  city       text not null,
  name       text not null,
  parent_id  uuid references public.areas(id),
  aliases    text[] not null default '{}',
  created_at timestamptz not null default now(),
  unique (city, name)
);

create index areas_name_trgm_idx on public.areas using gin (name gin_trgm_ops);
create index areas_parent_idx on public.areas (parent_id);

-- ---------- audit log (append only) ----------

create table public.audit_log (
  id           bigserial primary key,
  actor_id     uuid references public.profiles(id),
  action       audit_action not null,
  subject_type text not null,
  subject_id   uuid,
  metadata     jsonb not null default '{}'::jsonb,
  ip_address   inet,
  occurred_at  timestamptz not null default now()
);

create index audit_subject_idx on public.audit_log (subject_type, subject_id, occurred_at desc);
create index audit_actor_idx   on public.audit_log (actor_id, occurred_at desc);

-- audit rows are immutable
create rule audit_log_no_update as on update to public.audit_log do instead nothing;
create rule audit_log_no_delete as on delete to public.audit_log do instead nothing;

-- ---------- updated_at helper ----------

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();

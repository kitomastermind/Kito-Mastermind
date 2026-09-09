create table public.dues_schedules (
  id             uuid primary key default gen_random_uuid(),
  chapter_id     uuid not null references public.chapters(id) on delete cascade,
  amount         bigint not null,                 -- KES CENTS
  day_of_month   smallint not null,
  effective_from date not null,
  effective_to   date,
  check (amount > 0),
  check (day_of_month between 1 and 28)           -- 28 avoids February entirely
);

create table public.contributions (
  id           uuid primary key default gen_random_uuid(),
  profile_id   uuid not null references public.profiles(id) on delete restrict,
  chapter_id   uuid not null references public.chapters(id),
  type         contribution_type not null,
  description  text not null,
  amount       bigint not null,                   -- KES CENTS, always positive
  method       payment_method,
  status       payment_status not null default 'PENDING',
  due_date     date,
  paid_at      timestamptz,
  recorded_by  uuid references public.profiles(id),
  period_key   text,                              -- '2026-07' for dues, dedupes generation
  voided_at    timestamptz,
  void_reason  text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  check (amount > 0),
  check (voided_at is null or void_reason is not null)
);

create index contributions_member_idx  on public.contributions (profile_id, paid_at desc nulls last);
create index contributions_chapter_idx on public.contributions (chapter_id, type, status);
-- one dues row per member per month
create unique index contributions_dues_period_idx
  on public.contributions (profile_id, period_key)
  where type = 'DUES' and voided_at is null;

create trigger contributions_touch before update on public.contributions
  for each row execute function public.touch_updated_at();

create table public.mpesa_payments (
  id                   uuid primary key default gen_random_uuid(),
  contribution_id      uuid unique references public.contributions(id) on delete set null,
  chapter_id           uuid references public.chapters(id),
  profile_id           uuid references public.profiles(id),
  merchant_request_id  text,
  checkout_request_id  text unique,
  mpesa_receipt_number text unique,               -- THE idempotency key
  account_reference    text,
  phone_number         text not null,
  amount               bigint not null,           -- KES CENTS
  result_code          integer,
  result_desc          text,
  raw_callback         jsonb,
  allocated_at         timestamptz,
  allocated_by         uuid references public.profiles(id),
  created_at           timestamptz not null default now(),
  completed_at         timestamptz
);

create index mpesa_unallocated_idx
  on public.mpesa_payments (chapter_id, created_at desc)
  where contribution_id is null and result_code = 0;

create table public.statements (
  id           uuid primary key default gen_random_uuid(),
  profile_id   uuid not null references public.profiles(id) on delete cascade,
  period_start date not null,
  period_end   date not null,
  format       text not null check (format in ('PDF','CSV')),
  file_key     text not null,
  reference    text not null unique,              -- 'KITO-STMT-2026-000142'
  generated_at timestamptz not null default now()
);
create index statements_member_idx on public.statements (profile_id, generated_at desc);

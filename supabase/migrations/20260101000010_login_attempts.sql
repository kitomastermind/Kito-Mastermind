-- ============================================================
-- KITO Mastermind :: 010 :: login attempts (rate limit)
-- ============================================================

alter type audit_action add value if not exists 'LOGIN_FAILED';
alter type audit_action add value if not exists 'LOGIN_LOCKED';

create table public.login_attempts (
  id          bigserial primary key,
  email       text not null,
  succeeded   boolean not null,
  ip_address  inet,
  occurred_at timestamptz not null default now()
);

create index login_attempts_email_idx
  on public.login_attempts (lower(email), occurred_at desc);

alter table public.login_attempts enable row level security;
-- No client policies. Written only via the service role after the login action.

create or replace function public.write_audit(
  p_action audit_action,
  p_subject_type text,
  p_subject_id uuid,
  p_metadata jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.audit_log (actor_id, action, subject_type, subject_id, metadata)
  values (auth.uid(), p_action, p_subject_type, p_subject_id, coalesce(p_metadata, '{}'::jsonb));
end $$;

revoke all on function public.write_audit(audit_action, text, uuid, jsonb) from anon;
grant execute on function public.write_audit(audit_action, text, uuid, jsonb) to authenticated;
grant execute on function public.write_audit(audit_action, text, uuid, jsonb) to service_role;


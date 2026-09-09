-- ============================================================
-- KITO Mastermind :: 012 :: money RPCs (dues, STK, C2B, PII)
-- ============================================================

create or replace function public.complete_stk_payment(
  p_checkout_request_id text,
  p_receipt text,
  p_result_code integer,
  p_result_desc text,
  p_raw jsonb
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  existing uuid;
  payment public.mpesa_payments%rowtype;
begin
  if p_receipt is not null and p_receipt <> '' then
    select contribution_id into existing
      from public.mpesa_payments
     where mpesa_receipt_number = p_receipt
       and completed_at is not null
     limit 1;
    if existing is not null then
      return existing;
    end if;
  end if;

  select * into payment
    from public.mpesa_payments
   where checkout_request_id = p_checkout_request_id
   for update;
  if not found then
    raise exception 'Unknown checkout request';
  end if;

  update public.mpesa_payments
     set raw_callback = coalesce(raw_callback, p_raw),
         result_code = p_result_code,
         result_desc = p_result_desc,
         mpesa_receipt_number = coalesce(mpesa_receipt_number, nullif(p_receipt, '')),
         completed_at = case when p_result_code = 0 then now() else completed_at end
   where id = payment.id;

  if p_result_code = 0 and payment.contribution_id is not null then
    update public.contributions
       set status = 'PAID',
           method = 'MPESA',
           paid_at = coalesce(paid_at, now())
     where id = payment.contribution_id
       and voided_at is null
       and status is distinct from 'PAID';
  end if;

  return payment.contribution_id;
end $$;

revoke all on function public.complete_stk_payment(text, text, integer, text, jsonb) from anon, authenticated;
grant execute on function public.complete_stk_payment(text, text, integer, text, jsonb) to service_role;

create or replace function public.generate_month_dues(p_period_key text, p_due_date date)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  inserted integer := 0;
  schedule public.dues_schedules%rowtype;
  member public.profiles%rowtype;
begin
  for schedule in
    select * from public.dues_schedules
     where effective_from <= p_due_date
       and (effective_to is null or effective_to >= p_due_date)
  loop
    for member in
      select * from public.profiles
       where chapter_id = schedule.chapter_id and active = true
    loop
      if exists (
        select 1 from public.contributions c
         where c.profile_id = member.id
           and c.period_key = p_period_key
           and c.type = 'DUES'
           and c.voided_at is null
      ) then
        continue;
      end if;
      insert into public.contributions (
        profile_id, chapter_id, type, description, amount, status, due_date, period_key
      ) values (
        member.id,
        schedule.chapter_id,
        'DUES',
        'Monthly dues ' || p_period_key,
        schedule.amount,
        'PENDING',
        p_due_date,
        p_period_key
      );
      inserted := inserted + 1;
    end loop;
  end loop;
  return inserted;
end $$;

revoke all on function public.generate_month_dues(text, date) from anon, authenticated;
grant execute on function public.generate_month_dues(text, date) to service_role;

create or replace function public.purge_stale_lead_pii()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  n integer;
begin
  update public.leads
     set client_name = '[purged]',
         client_phone = null,
         client_email = null,
         notes = null,
         pii_purged_at = now()
   where pii_purged_at is null
     and status in ('CLOSED', 'LOST')
     and updated_at < now() - interval '24 months';
  get diagnostics n = row_count;
  return n;
end $$;

revoke all on function public.purge_stale_lead_pii() from anon, authenticated;
grant execute on function public.purge_stale_lead_pii() to service_role;

create or replace function public.allocate_mpesa_payment(
  p_payment_id uuid,
  p_contribution_id uuid,
  p_actor uuid
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.mpesa_payments
     set contribution_id = p_contribution_id,
         allocated_at = now(),
         allocated_by = p_actor
   where id = p_payment_id
     and contribution_id is null;
  if not found then
    raise exception 'Payment already allocated';
  end if;
  update public.contributions
     set status = 'PAID',
         method = 'MPESA',
         paid_at = coalesce(paid_at, now())
   where id = p_contribution_id
     and voided_at is null;
end $$;

revoke all on function public.allocate_mpesa_payment(uuid, uuid, uuid) from anon;
grant execute on function public.allocate_mpesa_payment(uuid, uuid, uuid) to authenticated, service_role;

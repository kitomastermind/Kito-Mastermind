-- ============================================================
-- KITO Mastermind :: 009 :: integrity triggers
-- ============================================================

-- 1. An owner may never verify their own accountability action.
create or replace function public.guard_action_verification()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'VERIFIED' and old.status is distinct from 'VERIFIED' then
    if new.verified_by is null then
      raise exception 'VERIFIED requires verified_by';
    end if;
    if new.verified_by = new.owner_id then
      raise exception 'An action owner cannot verify their own action';
    end if;
    new.verified_at := now();
  end if;
  if new.status = 'COMPLETED' and old.status is distinct from 'COMPLETED' then
    new.completed_at := coalesce(new.completed_at, now());
  end if;
  return new;
end $$;

create trigger actions_guard_verification
  before update on public.accountability_actions
  for each row execute function public.guard_action_verification();

-- 2. A member cannot change their own role or chapter.
create or replace function public.guard_profile_privilege()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then return new; end if;             -- service role path
  if new.role is distinct from old.role
     or new.chapter_id is distinct from old.chapter_id
     or new.active is distinct from old.active then
    if not public.is_admin() then
      raise exception 'Role, chapter and active status are not self-editable';
    end if;
  end if;
  return new;
end $$;

create trigger profiles_guard_privilege
  before update on public.profiles
  for each row execute function public.guard_profile_privilege();

-- 3. Credit shares must total 100 before a deal can be verified.
create or replace function public.guard_deal_verification()
returns trigger language plpgsql security definer set search_path = public as $$
declare total int; unconfirmed int;
begin
  if new.verified_at is not null and old.verified_at is null then
    select coalesce(sum(credit_share),0), count(*) filter (where confirmed_at is null)
      into total, unconfirmed
      from public.closed_business_participants
      where closed_business_id = new.id;
    if total <> 100 then
      raise exception 'Credit shares total %, must be 100', total;
    end if;
    if unconfirmed > 0 then
      raise exception '% participant(s) have not confirmed the split', unconfirmed;
    end if;
  end if;
  return new;
end $$;

create trigger cb_guard_verification
  before update on public.closed_business
  for each row execute function public.guard_deal_verification();

-- 4. Log the first touch on a lead automatically, for the response-time metric.
create or replace function public.record_first_touch()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status <> 'NEW' and old.status = 'NEW' and new.first_touch_at is null then
    new.first_touch_at := now();
    insert into public.lead_activity (lead_id, actor_id, kind, from_status, to_status)
    values (new.id, coalesce(auth.uid(), new.owner_id), 'FIRST_TOUCH', old.status, new.status);
  elsif new.status is distinct from old.status then
    insert into public.lead_activity (lead_id, actor_id, kind, from_status, to_status)
    values (new.id, coalesce(auth.uid(), new.owner_id), 'STATUS_CHANGE', old.status, new.status);
  end if;
  if new.status = 'CLOSED' and old.status <> 'CLOSED' then
    new.closed_at := now();
  end if;
  return new;
end $$;

create trigger leads_record_activity
  before update on public.leads
  for each row execute function public.record_first_touch();

-- 5. Revoking a grant is the only permitted update to a grant.
create or replace function public.guard_grant_immutability()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.lead_id    is distinct from old.lead_id
     or new.grantee_id is distinct from old.grantee_id
     or new.grantor_id is distinct from old.grantor_id
     or new.granted_at is distinct from old.granted_at then
    raise exception 'Grants are immutable except for revocation and view tracking';
  end if;
  if old.revoked_at is not null and new.revoked_at is null then
    raise exception 'A revoked grant cannot be un-revoked. Issue a new grant.';
  end if;
  return new;
end $$;

create trigger grants_guard_immutability
  before update on public.lead_contact_grants
  for each row execute function public.guard_grant_immutability();

-- 6. Create the profile row when an invited user completes signup.
create or replace function public.handle_new_auth_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare inv public.invitations%rowtype;
begin
  select * into inv from public.invitations
   where lower(email) = lower(new.email)
     and accepted_at is null and revoked_at is null and expires_at > now()
   order by created_at desc limit 1;

  if inv.id is null then
    raise exception 'No valid invitation for this email. Signup is invitation only.';
  end if;

  insert into public.profiles (id, email, full_name, chapter_id, role)
  values (new.id, new.email,
          coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email,'@',1)),
          inv.chapter_id, inv.role);

  insert into public.notification_preferences (profile_id) values (new.id);
  update public.invitations set accepted_at = now() where id = inv.id;

  insert into public.audit_log (actor_id, action, subject_type, subject_id, metadata)
  values (new.id, 'MEMBER_ACCEPTED', 'profile', new.id,
          jsonb_build_object('invitation_id', inv.id));
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

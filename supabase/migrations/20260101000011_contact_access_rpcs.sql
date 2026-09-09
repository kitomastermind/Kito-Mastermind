-- ============================================================
-- KITO Mastermind :: 011 :: contact access RPCs, area search
-- ============================================================

-- A revoked grant must not block a later grant to the same person.
alter table public.lead_contact_grants
  drop constraint if exists lead_contact_grants_lead_id_grantee_id_key;

create unique index if not exists grants_one_active_idx
  on public.lead_contact_grants (lead_id, grantee_id)
  where revoked_at is null;

create or replace function public.search_areas(p_query text)
returns table (
  id uuid,
  city text,
  name text,
  parent_id uuid,
  score real
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    a.id,
    a.city,
    a.name,
    a.parent_id,
    greatest(
      similarity(a.name, p_query),
      similarity(a.city, p_query),
      coalesce((select max(similarity(alias, p_query)) from unnest(a.aliases) as alias), 0)
    )::real as score
  from public.areas a
  where p_query is not null
    and char_length(trim(p_query)) >= 2
    and (
      a.name % p_query
      or a.city % p_query
      or a.name ilike '%' || trim(p_query) || '%'
      or exists (select 1 from unnest(a.aliases) alias where alias % p_query)
    )
  order by score desc, a.name
  limit 12
$$;

revoke all on function public.search_areas(text) from anon;
grant execute on function public.search_areas(text) to authenticated;

create or replace function public.request_contact_access(
  p_lead_id uuid,
  p_match_id uuid,
  p_message text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  lead_row public.leads%rowtype;
  request_id uuid;
  expires timestamptz := now() + interval '14 days';
  owner_name text;
  requester_name text;
  area_label text;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;
  if p_message is not null and char_length(p_message) > 500 then
    raise exception 'Message must be 500 characters or fewer';
  end if;

  select * into lead_row from public.leads where id = p_lead_id;
  if lead_row.id is null then
    raise exception 'Lead not found';
  end if;
  if lead_row.owner_id = auth.uid() then
    raise exception 'You already own this lead';
  end if;
  if lead_row.chapter_id <> public.current_chapter_id() then
    raise exception 'Lead is not in your chapter';
  end if;

  insert into public.contact_access_requests (
    lead_id, match_id, requester_id, owner_id, message, expires_at
  )
  values (p_lead_id, p_match_id, auth.uid(), lead_row.owner_id, p_message, expires)
  returning id into request_id;

  if p_match_id is not null then
    update public.lead_matches
       set status = 'ACCESS_REQUESTED'
     where id = p_match_id;
  end if;

  select full_name into owner_name from public.profiles where id = lead_row.owner_id;
  select full_name into requester_name from public.profiles where id = auth.uid();
  select coalesce(a.name, lead_row.area_free_text, 'an area')
    into area_label
    from (select 1) s
    left join public.areas a on a.id = lead_row.area_id;

  insert into public.notifications (profile_id, type, title, body, link_path)
  values (
    lead_row.owner_id,
    'ACCESS_REQUESTED',
    'Access request',
    requester_name || ' requested contact access on a ' || lead_row.lead_type::text
      || ' lead in ' || area_label || '.',
    '/leads/' || p_lead_id::text
  );

  insert into public.audit_log (actor_id, action, subject_type, subject_id, metadata)
  values (
    auth.uid(),
    'ACCESS_REQUESTED',
    'contact_access_request',
    request_id,
    jsonb_build_object('lead_id', p_lead_id, 'match_id', p_match_id)
  );

  return request_id;
end $$;

revoke all on function public.request_contact_access(uuid, uuid, text) from anon;
grant execute on function public.request_contact_access(uuid, uuid, text) to authenticated;

create or replace function public.approve_access_request(p_request_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  req public.contact_access_requests%rowtype;
  grant_id uuid;
  owner_name text;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select * into req from public.contact_access_requests where id = p_request_id;
  if req.id is null then
    raise exception 'Request not found';
  end if;
  if req.owner_id <> auth.uid() then
    raise exception 'Only the owning agent can approve';
  end if;
  if req.status <> 'PENDING' then
    raise exception 'This request is no longer pending';
  end if;

  update public.contact_access_requests
     set status = 'APPROVED', responded_at = now()
   where id = p_request_id;

  insert into public.lead_contact_grants (
    lead_id, grantee_id, grantor_id, request_id, expires_at
  )
  values (req.lead_id, req.requester_id, req.owner_id, p_request_id, null)
  returning id into grant_id;

  if req.match_id is not null then
    update public.lead_matches
       set status = 'ACCESS_GRANTED'
     where id = req.match_id;
  end if;

  select full_name into owner_name from public.profiles where id = req.owner_id;

  insert into public.notifications (profile_id, type, title, body, link_path)
  values (
    req.requester_id,
    'ACCESS_GRANTED',
    'Access approved',
    owner_name || ' approved your access request.',
    '/leads/' || req.lead_id::text
  );

  insert into public.audit_log (actor_id, action, subject_type, subject_id, metadata)
  values (
    auth.uid(),
    'GRANT_CREATED',
    'lead_contact_grant',
    grant_id,
    jsonb_build_object('lead_id', req.lead_id, 'request_id', p_request_id)
  );

  return grant_id;
end $$;

revoke all on function public.approve_access_request(uuid) from anon;
grant execute on function public.approve_access_request(uuid) to authenticated;

create or replace function public.decline_access_request(
  p_request_id uuid,
  p_reason text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  req public.contact_access_requests%rowtype;
  owner_name text;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select * into req from public.contact_access_requests where id = p_request_id;
  if req.id is null then
    raise exception 'Request not found';
  end if;
  if req.owner_id <> auth.uid() then
    raise exception 'Only the owning agent can decline';
  end if;
  if req.status <> 'PENDING' then
    raise exception 'This request is no longer pending';
  end if;

  update public.contact_access_requests
     set status = 'DENIED',
         responded_at = now(),
         decline_reason = p_reason
   where id = p_request_id;

  if req.match_id is not null then
    update public.lead_matches
       set status = 'DECLINED'
     where id = req.match_id;
  end if;

  select full_name into owner_name from public.profiles where id = req.owner_id;

  insert into public.notifications (profile_id, type, title, body, link_path)
  values (
    req.requester_id,
    'ACCESS_DENIED',
    'Access not shared',
    owner_name || ' is not sharing contact details for this lead.',
    '/leads'
  );

  insert into public.audit_log (actor_id, action, subject_type, subject_id, metadata)
  values (
    auth.uid(),
    'ACCESS_DENIED',
    'contact_access_request',
    p_request_id,
    jsonb_build_object('lead_id', req.lead_id)
  );
end $$;

revoke all on function public.decline_access_request(uuid, text) from anon;
grant execute on function public.decline_access_request(uuid, text) to authenticated;

create or replace function public.revoke_lead_grant(p_grant_id uuid, p_reason text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  g public.lead_contact_grants%rowtype;
  grantor_name text;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select * into g from public.lead_contact_grants where id = p_grant_id;
  if g.id is null then
    raise exception 'Grant not found';
  end if;
  if g.grantor_id <> auth.uid() then
    raise exception 'Only the grantor can revoke access';
  end if;
  if g.revoked_at is not null then
    raise exception 'This grant has already been revoked';
  end if;

  update public.lead_contact_grants
     set revoked_at = now(), revoked_reason = p_reason
   where id = p_grant_id;

  select full_name into grantor_name from public.profiles where id = g.grantor_id;

  insert into public.notifications (profile_id, type, title, body, link_path)
  values (
    g.grantee_id,
    'ACCESS_REVOKED',
    'Access revoked',
    grantor_name || ' revoked access to a lead.',
    '/leads'
  );

  insert into public.audit_log (actor_id, action, subject_type, subject_id, metadata)
  values (
    auth.uid(),
    'GRANT_REVOKED',
    'lead_contact_grant',
    p_grant_id,
    jsonb_build_object('lead_id', g.lead_id)
  );
end $$;

revoke all on function public.revoke_lead_grant(uuid, text) from anon;
grant execute on function public.revoke_lead_grant(uuid, text) to authenticated;

create or replace function public.expire_pending_access_requests()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  n integer := 0;
  req record;
begin
  for req in
    select r.id, r.requester_id, r.lead_id
      from public.contact_access_requests r
     where r.status = 'PENDING'
       and r.expires_at <= now()
  loop
    update public.contact_access_requests
       set status = 'EXPIRED'
     where id = req.id
       and status = 'PENDING';
    if found then
      n := n + 1;
      insert into public.notifications (profile_id, type, title, body, link_path)
      values (
        req.requester_id,
        'ACCESS_DENIED',
        'Access request expired',
        'Your contact access request expired before a decision was made.',
        '/leads'
      );
    end if;
  end loop;
  return n;
end $$;

revoke all on function public.expire_pending_access_requests() from public;
grant execute on function public.expire_pending_access_requests() to service_role;

create or replace function public.record_lead_contact_view(p_lead_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  last_audit timestamptz;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;
  if public.is_lead_owner(p_lead_id) then
    return;
  end if;
  if not public.has_lead_contact_access(p_lead_id) then
    raise exception 'No active contact grant for this lead';
  end if;

  update public.lead_contact_grants
     set last_viewed_at = now()
   where lead_id = p_lead_id
     and grantee_id = auth.uid()
     and revoked_at is null;

  select max(occurred_at) into last_audit
    from public.audit_log
   where actor_id = auth.uid()
     and action = 'LEAD_CONTACT_VIEWED'
     and subject_id = p_lead_id;

  if last_audit is not null and last_audit > now() - interval '1 hour' then
    return;
  end if;

  insert into public.audit_log (actor_id, action, subject_type, subject_id, metadata)
  values (
    auth.uid(),
    'LEAD_CONTACT_VIEWED',
    'lead',
    p_lead_id,
    jsonb_build_object('lead_id', p_lead_id)
  );
end $$;

revoke all on function public.record_lead_contact_view(uuid) from anon;
grant execute on function public.record_lead_contact_view(uuid) to authenticated;

-- ============================================================
-- KITO Mastermind :: 006 :: RLS helper functions
-- ============================================================

create or replace function public.current_chapter_id()
returns uuid language sql stable security definer set search_path = public as $$
  select chapter_id from public.profiles where id = auth.uid()
$$;

create or replace function public.current_role()
returns app_role language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid()
$$;

create or replace function public.is_active_member()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select active from public.profiles where id = auth.uid()), false)
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select role = 'ADMIN' and active
                   from public.profiles where id = auth.uid()), false)
$$;

create or replace function public.is_chapter_lead(target_chapter uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select active and (role = 'ADMIN'
            or (role = 'CHAPTER_LEAD' and chapter_id = target_chapter))
          from public.profiles where id = auth.uid()), false)
$$;

create or replace function public.is_treasurer(target_chapter uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select active and (role = 'ADMIN'
            or (role = 'TREASURER' and chapter_id = target_chapter))
          from public.profiles where id = auth.uid()), false)
$$;

create or replace function public.in_same_chapter(target_chapter uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select active and chapter_id = target_chapter
                   from public.profiles where id = auth.uid()), false)
$$;

-- THE contact access check. Referenced by the leads RLS policy.
-- Note there is no admin branch. That absence is the product's core promise.
create or replace function public.has_lead_contact_access(target_lead uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1
    from public.lead_contact_grants g
    join public.profiles p on p.id = auth.uid()
    where g.lead_id    = target_lead
      and g.grantee_id = auth.uid()
      and g.revoked_at is null
      and (g.expires_at is null or g.expires_at > now())
      and p.active
  )
$$;

create or replace function public.is_lead_owner(target_lead uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.leads l
    where l.id = target_lead and l.owner_id = auth.uid()
  )
$$;

create or replace function public.is_thread_participant(target_thread uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1
    from public.match_threads t
    join public.lead_matches m on m.id = t.match_id
    join public.leads la on la.id = m.lead_a_id
    join public.leads lb on lb.id = m.lead_b_id
    where t.id = target_thread
      and auth.uid() in (la.owner_id, lb.owner_id)
  )
$$;

create or replace function public.current_cycle_id(target_chapter uuid)
returns uuid language sql stable security definer set search_path = public as $$
  select id from public.cycles
  where chapter_id = target_chapter
    and current_date between start_date and end_date
  order by start_date desc limit 1
$$;

revoke execute on function public.current_chapter_id() from anon;
revoke execute on function public.has_lead_contact_access(uuid) from anon;

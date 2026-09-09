create or replace function public.matchable_leads()
returns table (
  id uuid,
  owner_id uuid,
  chapter_id uuid,
  lead_type public.lead_type,
  status public.lead_status,
  area_id uuid,
  area_free_text text,
  budget_min bigint,
  budget_max bigint,
  property_type public.property_type,
  timeline public.lead_timeline
)
language sql
security definer
set search_path = public
as $$
  select
    l.id, l.owner_id, l.chapter_id, l.lead_type, l.status, l.area_id,
    l.area_free_text, l.budget_min, l.budget_max, l.property_type, l.timeline
  from public.leads l
  where l.status not in ('CLOSED', 'LOST')
    and l.pii_purged_at is null;
$$;

revoke all on function public.matchable_leads() from anon, authenticated;
grant execute on function public.matchable_leads() to service_role;

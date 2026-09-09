-- ============================================================
-- KITO Mastermind :: 008 :: views
-- ============================================================

-- The chapter pool. Every member sees every other member's leads HERE,
-- and only here, with the protected columns structurally absent.
create view public.lead_pool
with (security_invoker = false) as
select
  l.id,
  l.owner_id,
  p.full_name        as owner_name,
  l.chapter_id,
  l.lead_type,
  l.property_type,
  l.area_id,
  coalesce(a.name, l.area_free_text) as area_label,
  l.budget_min,
  l.budget_max,
  l.timeline,
  l.status,
  l.created_at,
  (l.first_touch_at is not null) as has_been_touched
from public.leads l
join public.profiles p on p.id = l.owner_id
left join public.areas a on a.id = l.area_id
where l.chapter_id = public.current_chapter_id()
  and l.pii_purged_at is null;

revoke all on public.lead_pool from anon;
grant select on public.lead_pool to authenticated;

-- Forum feed with computed aggregates. Averages are never stored on the post.
create view public.forum_post_stats
with (security_invoker = true) as
select
  fp.id as post_id,
  coalesce(round(avg(fr.stars)::numeric, 2), 0)::numeric as average_rating,
  count(fr.id)::int                                      as rating_count,
  (select count(*) from public.forum_replies r
   where r.post_id = fp.id and r.hidden_at is null)::int  as reply_count
from public.forum_posts fp
left join public.forum_ratings fr on fr.post_id = fp.id
group by fp.id;

grant select on public.forum_post_stats to authenticated;

-- Member points rollup for the current cycle.
create view public.member_points_summary
with (security_invoker = true) as
select
  pe.profile_id,
  pe.cycle_id,
  pe.category,
  sum(pe.points)::int as points
from public.points_entries pe
group by pe.profile_id, pe.cycle_id, pe.category;

grant select on public.member_points_summary to authenticated;

-- Chapter monthly contribution totals. Aggregates are not private; line items are.
create view public.chapter_monthly_contributions
with (security_invoker = false) as
select
  c.chapter_id,
  date_trunc('month', c.paid_at)::date as month,
  sum(c.amount)::bigint                as total_cents,
  count(*)::int                        as payment_count
from public.contributions c
where c.status = 'PAID' and c.voided_at is null
  and c.chapter_id = public.current_chapter_id()
group by c.chapter_id, date_trunc('month', c.paid_at);

revoke all on public.chapter_monthly_contributions from anon;
grant select on public.chapter_monthly_contributions to authenticated;

-- Response time per member, from first-touch latency. Median, not mean.
create view public.member_response_times
with (security_invoker = false) as
select
  l.owner_id as profile_id,
  count(*) filter (where l.first_touch_at is not null)::int as touched_count,
  percentile_cont(0.5) within group (
    order by extract(epoch from (l.first_touch_at - l.created_at)) / 60
  ) as median_minutes
from public.leads l
where l.chapter_id = public.current_chapter_id()
group by l.owner_id;

revoke all on public.member_response_times from anon;
grant select on public.member_response_times to authenticated;

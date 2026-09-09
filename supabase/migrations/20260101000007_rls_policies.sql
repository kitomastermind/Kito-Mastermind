-- ============================================================
-- KITO Mastermind :: 007 :: Row Level Security
-- ============================================================

-- Enable RLS on every table. No exceptions.
alter table public.chapters                     enable row level security;
alter table public.profiles                     enable row level security;
alter table public.invitations                  enable row level security;
alter table public.cycles                       enable row level security;
alter table public.areas                        enable row level security;
alter table public.audit_log                    enable row level security;
alter table public.leads                        enable row level security;
alter table public.lead_activity                enable row level security;
alter table public.lead_matches                 enable row level security;
alter table public.contact_access_requests      enable row level security;
alter table public.lead_contact_grants          enable row level security;
alter table public.match_threads                enable row level security;
alter table public.match_messages               enable row level security;
alter table public.closed_business              enable row level security;
alter table public.closed_business_participants enable row level security;
alter table public.mastermind_sessions          enable row level security;
alter table public.session_attendance           enable row level security;
alter table public.pairings                     enable row level security;
alter table public.pairing_requests             enable row level security;
alter table public.accountability_actions       enable row level security;
alter table public.dues_schedules               enable row level security;
alter table public.contributions                enable row level security;
alter table public.mpesa_payments               enable row level security;
alter table public.statements                   enable row level security;
alter table public.forum_topics                 enable row level security;
alter table public.forum_posts                  enable row level security;
alter table public.forum_replies                enable row level security;
alter table public.forum_ratings                enable row level security;
alter table public.points_config                enable row level security;
alter table public.points_entries               enable row level security;
alter table public.notifications                enable row level security;
alter table public.notification_preferences     enable row level security;
alter table public.crm_connections              enable row level security;

-- ============ LEADS: the protected core ============
--
-- SELECT on the base table is restricted to the owner and active grantees.
-- Everyone else in the chapter reads the redacted view `lead_pool` (migration 008),
-- which does not contain the protected columns at all.
--
-- There is deliberately NO admin bypass policy here. Do not add one.

create policy leads_select_owner_or_grantee on public.leads
  for select to authenticated
  using (
    public.is_active_member()
    and (owner_id = auth.uid() or public.has_lead_contact_access(id))
  );

create policy leads_insert_self on public.leads
  for insert to authenticated
  with check (
    public.is_active_member()
    and owner_id = auth.uid()
    and chapter_id = public.current_chapter_id()
    and consent_confirmed = true
  );

create policy leads_update_owner on public.leads
  for update to authenticated
  using (owner_id = auth.uid() and public.is_active_member())
  with check (owner_id = auth.uid());

create policy leads_delete_owner on public.leads
  for delete to authenticated
  using (owner_id = auth.uid() and public.is_active_member());

-- ============ lead activity ============

create policy lead_activity_select on public.lead_activity
  for select to authenticated
  using (
    public.is_lead_owner(lead_id)
    or actor_id = auth.uid()
    or public.has_lead_contact_access(lead_id)
  );

create policy lead_activity_insert on public.lead_activity
  for insert to authenticated
  with check (
    actor_id = auth.uid()
    and (public.is_lead_owner(lead_id) or public.has_lead_contact_access(lead_id))
  );

-- ============ matches ============
-- A match is visible to both lead owners. It contains no PII.

create policy lead_matches_select on public.lead_matches
  for select to authenticated
  using (public.is_lead_owner(lead_a_id) or public.is_lead_owner(lead_b_id));

-- matches are created by the server (service role) only. No client insert policy.

-- ============ access requests ============

create policy car_select on public.contact_access_requests
  for select to authenticated
  using (requester_id = auth.uid() or owner_id = auth.uid());

create policy car_insert_requester on public.contact_access_requests
  for insert to authenticated
  with check (
    public.is_active_member()
    and requester_id = auth.uid()
    and owner_id <> auth.uid()
    -- requester must share a chapter with the lead
    and exists (
      select 1 from public.leads l
      where l.id = lead_id and l.chapter_id = public.current_chapter_id()
    )
  );

-- only the OWNER may respond
create policy car_update_owner on public.contact_access_requests
  for update to authenticated
  using (owner_id = auth.uid() and status = 'PENDING')
  with check (owner_id = auth.uid());

-- ============ grants ============

create policy grants_select on public.lead_contact_grants
  for select to authenticated
  using (grantor_id = auth.uid() or grantee_id = auth.uid());

create policy grants_insert_grantor on public.lead_contact_grants
  for insert to authenticated
  with check (grantor_id = auth.uid() and public.is_lead_owner(lead_id));

-- only the grantor can revoke; revocation is the only permitted update
create policy grants_update_grantor on public.lead_contact_grants
  for update to authenticated
  using (grantor_id = auth.uid())
  with check (grantor_id = auth.uid());

-- ============ match threads ============

create policy threads_select on public.match_threads
  for select to authenticated using (public.is_thread_participant(id));

create policy threads_insert on public.match_threads
  for insert to authenticated
  with check (
    exists (select 1 from public.lead_matches m
            join public.leads la on la.id = m.lead_a_id
            join public.leads lb on lb.id = m.lead_b_id
            where m.id = match_id and auth.uid() in (la.owner_id, lb.owner_id))
  );

create policy messages_select on public.match_messages
  for select to authenticated using (public.is_thread_participant(thread_id));

create policy messages_insert on public.match_messages
  for insert to authenticated
  with check (author_id = auth.uid() and public.is_thread_participant(thread_id));

-- ============ profiles ============
-- Members see other members in their own chapter. Admin sees all.
-- Phone and email are exposed only to same-chapter members, which is intended:
-- these are the AGENTS' own details, not client PII.

create policy profiles_select_chapter on public.profiles
  for select to authenticated
  using (
    id = auth.uid()
    or public.is_admin()
    or (public.is_active_member() and chapter_id = public.current_chapter_id())
  );

create policy profiles_update_self on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());
-- Role and chapter changes go through the service role after a policy.ts check.
-- Guarded by a trigger in migration 009.

-- ============ chapters, areas, cycles ============

create policy chapters_select on public.chapters
  for select to authenticated using (true);

create policy areas_select on public.areas
  for select to authenticated using (true);

create policy cycles_select on public.cycles
  for select to authenticated
  using (chapter_id = public.current_chapter_id() or public.is_admin());

-- ============ accountability ============

create policy sessions_select on public.mastermind_sessions
  for select to authenticated
  using (public.in_same_chapter(chapter_id) or public.is_admin());

create policy sessions_write on public.mastermind_sessions
  for all to authenticated
  using (public.is_chapter_lead(chapter_id))
  with check (public.is_chapter_lead(chapter_id));

create policy attendance_select on public.session_attendance
  for select to authenticated
  using (
    profile_id = auth.uid()
    or exists (select 1 from public.mastermind_sessions s
               where s.id = session_id and public.in_same_chapter(s.chapter_id))
  );

create policy attendance_write on public.session_attendance
  for all to authenticated
  using (exists (select 1 from public.mastermind_sessions s
                 where s.id = session_id and public.is_chapter_lead(s.chapter_id)))
  with check (exists (select 1 from public.mastermind_sessions s
                      where s.id = session_id and public.is_chapter_lead(s.chapter_id)));

create policy pairings_select on public.pairings
  for select to authenticated
  using (public.in_same_chapter(chapter_id) or public.is_admin());

create policy pairings_write on public.pairings
  for all to authenticated
  using (public.is_chapter_lead(chapter_id))
  with check (public.is_chapter_lead(chapter_id));

create policy pairing_requests_select on public.pairing_requests
  for select to authenticated
  using (profile_id = auth.uid() or public.is_chapter_lead(chapter_id));

create policy pairing_requests_insert on public.pairing_requests
  for insert to authenticated with check (profile_id = auth.uid());

-- Actions: owner, partner and chapter lead.
create policy actions_select on public.accountability_actions
  for select to authenticated
  using (
    owner_id = auth.uid()
    or partner_id = auth.uid()
    or public.is_chapter_lead(chapter_id)
  );

create policy actions_insert on public.accountability_actions
  for insert to authenticated
  with check (
    public.is_active_member()
    and chapter_id = public.current_chapter_id()
    and (owner_id = auth.uid()
         or exists (select 1 from public.pairings p
                    where p.ended_at is null
                      and ((p.profile_a = auth.uid() and p.profile_b = owner_id)
                        or (p.profile_b = auth.uid() and p.profile_a = owner_id))))
  );

-- The asymmetry that makes accountability mean anything:
-- the owner may progress an action, but only a partner or lead may verify it.
create policy actions_update on public.accountability_actions
  for update to authenticated
  using (owner_id = auth.uid() or partner_id = auth.uid() or public.is_chapter_lead(chapter_id))
  with check (owner_id = auth.uid() or partner_id = auth.uid() or public.is_chapter_lead(chapter_id));
-- The specific rule "owner cannot set VERIFIED" is enforced by the CHECK constraint
-- in migration 003 plus the trigger in migration 009. Do not rely on the app alone.

-- ============ money ============

create policy dues_select on public.dues_schedules
  for select to authenticated using (public.in_same_chapter(chapter_id));

create policy dues_write on public.dues_schedules
  for all to authenticated
  using (public.is_treasurer(chapter_id)) with check (public.is_treasurer(chapter_id));

create policy contributions_select on public.contributions
  for select to authenticated
  using (profile_id = auth.uid() or public.is_treasurer(chapter_id));

create policy contributions_insert on public.contributions
  for insert to authenticated
  with check (public.is_treasurer(chapter_id) and recorded_by = auth.uid());

create policy contributions_update on public.contributions
  for update to authenticated
  using (public.is_treasurer(chapter_id)) with check (public.is_treasurer(chapter_id));
-- No delete policy anywhere. Contributions are voided, never removed.

create policy mpesa_select on public.mpesa_payments
  for select to authenticated
  using (profile_id = auth.uid() or public.is_treasurer(chapter_id));

create policy statements_select on public.statements
  for select to authenticated using (profile_id = auth.uid());

-- ============ forum ============

create policy topics_select on public.forum_topics
  for select to authenticated
  using (chapter_id is null or public.in_same_chapter(chapter_id) or public.is_admin());

create policy topics_write on public.forum_topics
  for all to authenticated
  using (public.is_chapter_lead(coalesce(chapter_id, public.current_chapter_id())))
  with check (public.is_chapter_lead(coalesce(chapter_id, public.current_chapter_id())));

create policy posts_select on public.forum_posts
  for select to authenticated
  using (
    hidden_at is null
    or author_id = auth.uid()
    or public.is_chapter_lead(public.current_chapter_id())
  );

create policy posts_insert on public.forum_posts
  for insert to authenticated
  with check (author_id = auth.uid() and public.is_active_member());

create policy posts_update on public.forum_posts
  for update to authenticated
  using (author_id = auth.uid() or public.is_chapter_lead(public.current_chapter_id()))
  with check (author_id = auth.uid() or public.is_chapter_lead(public.current_chapter_id()));

create policy replies_select on public.forum_replies
  for select to authenticated using (hidden_at is null or author_id = auth.uid());

create policy replies_insert on public.forum_replies
  for insert to authenticated with check (author_id = auth.uid());

create policy ratings_select on public.forum_ratings
  for select to authenticated using (true);

-- A member may not rate their own lesson.
create policy ratings_write on public.forum_ratings
  for all to authenticated
  using (profile_id = auth.uid())
  with check (
    profile_id = auth.uid()
    and not exists (select 1 from public.forum_posts p
                    where p.id = post_id and p.author_id = auth.uid())
  );

-- ============ points ============

create policy points_config_select on public.points_config
  for select to authenticated using (true);

create policy points_entries_select on public.points_entries
  for select to authenticated
  using (
    profile_id = auth.uid()
    or exists (select 1 from public.profiles p
               where p.id = points_entries.profile_id
                 and public.in_same_chapter(p.chapter_id))
  );
-- points are written by the service role only

-- ============ closed business ============

create policy cb_select on public.closed_business
  for select to authenticated
  using (
    public.in_same_chapter(chapter_id)
    or exists (select 1 from public.closed_business_participants cbp
               where cbp.closed_business_id = closed_business.id
                 and cbp.profile_id = auth.uid())
  );

create policy cb_insert on public.closed_business
  for insert to authenticated
  with check (created_by = auth.uid() and public.in_same_chapter(chapter_id));

create policy cb_update on public.closed_business
  for update to authenticated
  using (created_by = auth.uid() or public.is_chapter_lead(chapter_id))
  with check (created_by = auth.uid() or public.is_chapter_lead(chapter_id));

create policy cbp_select on public.closed_business_participants
  for select to authenticated
  using (exists (select 1 from public.closed_business cb
                 where cb.id = closed_business_id and public.in_same_chapter(cb.chapter_id)));

create policy cbp_update_self on public.closed_business_participants
  for update to authenticated
  using (profile_id = auth.uid()) with check (profile_id = auth.uid());

-- ============ notifications ============

create policy notifications_select on public.notifications
  for select to authenticated using (profile_id = auth.uid());

create policy notifications_update on public.notifications
  for update to authenticated
  using (profile_id = auth.uid()) with check (profile_id = auth.uid());

create policy notif_prefs_all on public.notification_preferences
  for all to authenticated
  using (profile_id = auth.uid()) with check (profile_id = auth.uid());

-- ============ CRM connections ============
-- Only the owner. No admin branch, ever. Tokens are additionally encrypted at rest.

create policy crm_all_self on public.crm_connections
  for all to authenticated
  using (profile_id = auth.uid()) with check (profile_id = auth.uid());

-- ============ audit log ============
-- Readable by chapter leads and admins for their own scope. Never writable from a client.

create policy audit_select on public.audit_log
  for select to authenticated
  using (actor_id = auth.uid() or public.is_admin());

-- ============ invitations ============

create policy invitations_select on public.invitations
  for select to authenticated
  using (public.is_chapter_lead(chapter_id));
-- Acceptance is handled by the service role, since the accepting user has no session yet.

-- Reviewer demo accounts. Safe in the SQL Editor: touches public.* only,
-- then inserts auth users so the existing trigger can create profiles.
-- Password for every account: Kito-Demo-2026!

create table if not exists public.reviewer_seed_allowlist (
  email        text primary key,
  full_name    text not null,
  role         public.app_role not null,
  brokerage    text,
  phone        text,
  chapter_code text not null default 'NBO'
);

alter table public.reviewer_seed_allowlist enable row level security;

insert into public.reviewer_seed_allowlist (email, full_name, role, brokerage, phone, chapter_code)
values
  ('james.gitonga@kito.test', 'James Gitonga', 'ADMIN', 'KITO Network', '+254711000006', 'NBO'),
  ('amina.hassan@kito.test', 'Amina Hassan', 'CHAPTER_LEAD', 'Coastal & Capital', '+254711000005', 'NBO'),
  ('grace.wanjiru@kito.test', 'Grace Wanjiru', 'TREASURER', 'Westlands Realty', '+254711000001', 'NBO'),
  ('daniel.otieno@kito.test', 'Daniel Otieno', 'MEMBER', 'Lakeview Homes', '+254711000002', 'NBO')
on conflict (email) do update
set
  full_name = excluded.full_name,
  role = excluded.role,
  brokerage = excluded.brokerage,
  phone = excluded.phone,
  chapter_code = excluded.chapter_code;

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  inv public.invitations%rowtype;
  seed public.reviewer_seed_allowlist%rowtype;
  chapter uuid;
begin
  select * into seed
    from public.reviewer_seed_allowlist
   where lower(email) = lower(new.email);

  if seed.email is not null then
    select id into chapter
      from public.chapters
     where code = seed.chapter_code
     limit 1;
    if chapter is null then
      raise exception 'Chapter % missing for reviewer seed', seed.chapter_code;
    end if;

    insert into public.profiles (
      id, email, full_name, phone, brokerage, chapter_id, role,
      agreement_version, agreement_accepted_at
    ) values (
      new.id, new.email, seed.full_name, seed.phone, seed.brokerage, chapter, seed.role,
      '2026-01', now()
    );

    insert into public.notification_preferences (profile_id) values (new.id);
    delete from public.reviewer_seed_allowlist where lower(email) = lower(new.email);
    return new;
  end if;

  select * into inv from public.invitations
   where lower(email) = lower(new.email)
     and accepted_at is null and revoked_at is null and expires_at > now()
   order by created_at desc
   limit 1;

  if inv.id is null then
    raise exception 'No valid invitation for this email. Signup is invitation only.';
  end if;

  insert into public.profiles (id, email, full_name, chapter_id, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    inv.chapter_id,
    inv.role
  );

  insert into public.notification_preferences (profile_id) values (new.id);
  update public.invitations set accepted_at = now() where id = inv.id;

  insert into public.audit_log (actor_id, action, subject_type, subject_id, metadata)
  values (
    new.id, 'MEMBER_ACCEPTED', 'profile', new.id,
    jsonb_build_object('invitation_id', inv.id)
  );
  return new;
end
$$;

do $$
declare
  uid uuid;
  rec record;
begin
  for rec in
    select email, full_name
    from public.reviewer_seed_allowlist
  loop
    if exists (select 1 from auth.users where lower(email) = lower(rec.email)) then
      continue;
    end if;

    uid := gen_random_uuid();

    insert into auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      recovery_token,
      email_change_token_new,
      email_change
    ) values (
      '00000000-0000-0000-0000-000000000000',
      uid,
      'authenticated',
      'authenticated',
      rec.email,
      crypt('Kito-Demo-2026!', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('full_name', rec.full_name),
      now(),
      now(),
      '',
      '',
      '',
      ''
    );

    insert into auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    ) values (
      gen_random_uuid(),
      uid,
      jsonb_build_object('sub', uid::text, 'email', rec.email),
      'email',
      uid::text,
      now(),
      now(),
      now()
    );
  end loop;
end $$;

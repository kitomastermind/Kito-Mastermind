drop policy if exists cb_select on public.closed_business;

create policy cb_select on public.closed_business
  for select to authenticated
  using (public.in_same_chapter(chapter_id) or public.is_admin());

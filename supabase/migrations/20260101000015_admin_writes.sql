create policy chapters_write on public.chapters
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy cycles_write on public.cycles
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Participants may be inserted by the member who created the deal.

create policy cbp_insert on public.closed_business_participants
  for insert to authenticated
  with check (
    exists (
      select 1 from public.closed_business cb
      where cb.id = closed_business_id
        and cb.created_by = auth.uid()
        and public.in_same_chapter(cb.chapter_id)
    )
  );

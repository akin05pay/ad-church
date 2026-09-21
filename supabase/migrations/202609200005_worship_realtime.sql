-- Public worship realtime, isolated to the AD Church project.
alter table public.worship_sessions replica identity full;
alter table public.worship_items replica identity full;

do $$
begin
  alter publication supabase_realtime add table public.worship_sessions;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.worship_items;
exception when duplicate_object then null;
end $$;

create unique index if not exists uq_worship_current_item_per_type
on public.worship_items(worship_session_id, item_type)
where is_current = true;

create policy "authorized_can_manage_scripture_passages" on public.scripture_passages
for all to authenticated
using (
  exists (
    select 1 from public.role_assignments ra
    where ra.user_id = (select auth.uid())
      and ra.status = 'active'
      and private.has_permission('content.manage', ra.organization_id, ra.scope_unit_id, ra.scope_ministry_id)
  )
)
with check (
  exists (
    select 1 from public.role_assignments ra
    where ra.user_id = (select auth.uid())
      and ra.status = 'active'
      and private.has_permission('content.manage', ra.organization_id, ra.scope_unit_id, ra.scope_ministry_id)
  )
);

create policy "authorized_can_manage_hymns" on public.hymns
for all to authenticated
using (
  exists (
    select 1 from public.role_assignments ra
    where ra.user_id = (select auth.uid())
      and ra.status = 'active'
      and private.has_permission('content.manage', ra.organization_id, ra.scope_unit_id, ra.scope_ministry_id)
  )
)
with check (
  exists (
    select 1 from public.role_assignments ra
    where ra.user_id = (select auth.uid())
      and ra.status = 'active'
      and private.has_permission('content.manage', ra.organization_id, ra.scope_unit_id, ra.scope_ministry_id)
  )
);

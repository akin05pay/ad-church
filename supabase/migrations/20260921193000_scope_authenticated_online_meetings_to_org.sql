-- AD Church 0.8 — keep authenticated online meetings inside the user's organization context.

create or replace function private.user_has_organization_context(target_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    exists (
      select 1
      from public.profiles pr
      join public.people pe on pe.id = pr.person_id
      where pr.user_id = (select auth.uid())
        and pe.organization_id = target_organization_id
    )
    or exists (
      select 1
      from public.role_assignments ra
      where ra.user_id = (select auth.uid())
        and ra.status = 'active'
        and ra.organization_id = target_organization_id
    );
$$;

revoke all on function private.user_has_organization_context(uuid)
from public, anon, authenticated;
grant execute on function private.user_has_organization_context(uuid)
to authenticated;

drop policy if exists "authenticated_can_read_online_meetings" on public.online_meetings;
create policy "authenticated_can_read_online_meetings"
on public.online_meetings
for select
to authenticated
using (
  active = true
  and status in ('scheduled','live')
  and (
    visibility = 'public'
    or (
      visibility = 'authenticated'
      and private.user_has_organization_context(organization_id)
    )
    or (
      visibility = 'unit_members'
      and private.user_has_membership_in_scope(unit_id)
    )
    or private.has_permission(
      'online.manage',
      organization_id,
      unit_id,
      ministry_id
    )
  )
);

drop policy if exists "authenticated_can_read_groups" on public.groups;
create policy "authenticated_can_read_groups"
on public.groups
for select
to authenticated
using (
  private.has_permission('groups.manage', organization_id, unit_id, ministry_id)
  or (
    active = true
    and (
      (
        visibility = 'unit_members'
        and private.user_has_membership_in_scope(unit_id)
      )
      or private.user_is_group_member(id)
    )
  )
);

drop policy if exists "authenticated_can_read_scoped_events" on public.events;
create policy "authenticated_can_read_scoped_events"
on public.events
for select
to authenticated
using (
  private.has_permission('events.manage', organization_id, unit_id, ministry_id)
  or (
    status = 'scheduled'
    and (
      visibility = 'public'
      or (
        visibility = 'organization'
        and private.user_has_organization_context(organization_id)
      )
      or (
        visibility = 'unit_members'
        and unit_id is not null
        and private.user_has_membership_in_scope(unit_id)
      )
      or (
        visibility = 'group_members'
        and group_id is not null
        and private.user_is_group_member(group_id)
      )
    )
  )
);

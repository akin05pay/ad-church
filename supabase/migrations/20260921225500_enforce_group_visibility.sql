drop policy if exists "authenticated_can_read_groups" on public.groups;
create policy "authenticated_can_read_groups"
on public.groups
for select
to authenticated
using (
  active = true
  and (
    (
      visibility = 'unit_members'
      and private.user_has_membership_in_scope(unit_id)
    )
    or private.user_is_group_member(id)
    or private.has_permission('groups.manage', organization_id, unit_id, ministry_id)
  )
);

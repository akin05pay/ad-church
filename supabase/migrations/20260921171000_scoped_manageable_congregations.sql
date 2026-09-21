create or replace function private.list_manageable_congregations(
  target_organization_id uuid
)
returns table (
  id uuid,
  name text,
  parent_unit_id uuid
)
language sql
stable
security definer
set search_path = ''
as $$
  select u.id, u.name, u.parent_unit_id
  from public.units u
  where u.organization_id = target_organization_id
    and u.unit_type = 'congregation'
    and u.active = true
    and private.has_permission(
      'people.manage',
      target_organization_id,
      u.id,
      null
    )
  order by u.name;
$$;

revoke all on function private.list_manageable_congregations(uuid)
from public, anon, authenticated;
grant execute on function private.list_manageable_congregations(uuid)
to authenticated;

create or replace function public.list_manageable_congregations(
  target_organization_id uuid
)
returns table (
  id uuid,
  name text,
  parent_unit_id uuid
)
language sql
security invoker
set search_path = ''
as $$
  select * from private.list_manageable_congregations(target_organization_id);
$$;

revoke all on function public.list_manageable_congregations(uuid)
from public, anon;
grant execute on function public.list_manageable_congregations(uuid)
to authenticated;

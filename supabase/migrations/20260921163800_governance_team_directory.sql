-- AD Church Governance 0.6 — secure team directory for authorized managers.

create or replace function private.list_manageable_team(target_organization_id uuid)
returns table (
  assignment_id uuid,
  user_id uuid,
  email text,
  role_id uuid,
  role_key text,
  role_name text,
  authority_rank integer,
  status text,
  scope_unit_id uuid,
  unit_name text,
  scope_ministry_id uuid,
  ministry_name text,
  granted_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    ra.id,
    ra.user_id,
    lower(trim(u.email)),
    r.id,
    r.key,
    r.name,
    r.authority_rank,
    ra.status,
    ra.scope_unit_id,
    un.name,
    ra.scope_ministry_id,
    m.name,
    ra.granted_at
  from public.role_assignments ra
  join public.roles r on r.id = ra.role_id
  join auth.users u on u.id = ra.user_id
  left join public.units un on un.id = ra.scope_unit_id
  left join public.ministries m on m.id = ra.scope_ministry_id
  where ra.organization_id = target_organization_id
    and (
      ra.user_id = (select auth.uid())
      or private.can_act_on_role('members.moderate', ra.role_id, ra.organization_id, ra.scope_unit_id, ra.scope_ministry_id)
      or private.can_act_on_role('team.manage', ra.role_id, ra.organization_id, ra.scope_unit_id, ra.scope_ministry_id)
    )
  order by r.authority_rank desc, ra.granted_at asc;
$$;

revoke all on function private.list_manageable_team(uuid) from public, anon, authenticated;

create or replace function public.list_manageable_team(target_organization_id uuid)
returns table (
  assignment_id uuid,
  user_id uuid,
  email text,
  role_id uuid,
  role_key text,
  role_name text,
  authority_rank integer,
  status text,
  scope_unit_id uuid,
  unit_name text,
  scope_ministry_id uuid,
  ministry_name text,
  granted_at timestamptz
)
language sql
security invoker
set search_path = ''
as $$
  select * from private.list_manageable_team(target_organization_id);
$$;

revoke all on function public.list_manageable_team(uuid) from public, anon;
grant execute on function public.list_manageable_team(uuid) to authenticated;

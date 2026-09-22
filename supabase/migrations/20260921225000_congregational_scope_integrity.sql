-- AD Church 0.9 — integrity checks for congregational references.

create or replace function private.validate_group_scope() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if not exists (
    select 1 from public.units u
    where u.id = new.unit_id and u.organization_id = new.organization_id and u.active = true
  ) then raise exception 'group_unit_outside_organization'; end if;

  if new.ministry_id is not null and not exists (
    select 1 from public.ministries m
    where m.id = new.ministry_id and m.organization_id = new.organization_id
      and m.unit_id = new.unit_id and m.active = true
  ) then raise exception 'group_ministry_scope_mismatch'; end if;

  if new.leader_person_id is not null and not exists (
    select 1 from public.people p
    join public.memberships ms on ms.person_id = p.id
    where p.id = new.leader_person_id and p.organization_id = new.organization_id
      and ms.unit_id = new.unit_id and ms.status = 'active'
  ) then raise exception 'group_leader_scope_mismatch'; end if;
  return new;
end;
$$;
revoke all on function private.validate_group_scope() from public, anon, authenticated;
drop trigger if exists groups_validate_scope on public.groups;
create trigger groups_validate_scope before insert or update of organization_id,unit_id,ministry_id,leader_person_id
on public.groups for each row execute function private.validate_group_scope();

create or replace function private.validate_group_membership_scope() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if not exists (
    select 1 from public.groups g
    join public.people p on p.id = new.person_id
    join public.memberships ms on ms.person_id = p.id and ms.unit_id = g.unit_id and ms.status = 'active'
    where g.id = new.group_id and p.organization_id = g.organization_id
  ) then raise exception 'group_membership_scope_mismatch'; end if;
  return new;
end;
$$;
revoke all on function private.validate_group_membership_scope() from public, anon, authenticated;
drop trigger if exists group_memberships_validate_scope on public.group_memberships;
create trigger group_memberships_validate_scope before insert or update of group_id,person_id
on public.group_memberships for each row execute function private.validate_group_membership_scope();

create or replace function private.validate_ministry_membership_scope() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if not exists (
    select 1 from public.ministries m
    join public.people p on p.id = new.person_id
    join public.memberships ms on ms.person_id = p.id and ms.unit_id = m.unit_id and ms.status = 'active'
    where m.id = new.ministry_id and p.organization_id = m.organization_id
  ) then raise exception 'ministry_membership_scope_mismatch'; end if;
  return new;
end;
$$;
revoke all on function private.validate_ministry_membership_scope() from public, anon, authenticated;
drop trigger if exists ministry_memberships_validate_scope on public.ministry_memberships;
create trigger ministry_memberships_validate_scope before insert or update of ministry_id,person_id
on public.ministry_memberships for each row execute function private.validate_ministry_membership_scope();

create or replace function private.validate_event_scope() returns trigger language plpgsql security definer set search_path = '' as $$
declare group_unit uuid; group_ministry uuid;
begin
  if new.unit_id is not null and not exists (
    select 1 from public.units u where u.id = new.unit_id
      and u.organization_id = new.organization_id and u.active = true
  ) then raise exception 'event_unit_outside_organization'; end if;

  if new.ministry_id is not null and not exists (
    select 1 from public.ministries m where m.id = new.ministry_id
      and m.organization_id = new.organization_id
      and (new.unit_id is null or m.unit_id = new.unit_id) and m.active = true
  ) then raise exception 'event_ministry_scope_mismatch'; end if;

  if new.group_id is not null then
    select g.unit_id,g.ministry_id into group_unit,group_ministry
    from public.groups g where g.id = new.group_id
      and g.organization_id = new.organization_id and g.active = true;
    if group_unit is null then raise exception 'event_group_scope_mismatch'; end if;
    if new.unit_id is not null and group_unit <> new.unit_id then raise exception 'event_group_unit_mismatch'; end if;
    if new.ministry_id is not null and group_ministry is distinct from new.ministry_id then raise exception 'event_group_ministry_mismatch'; end if;
  end if;

  if new.visibility = 'group_members' and new.group_id is null then raise exception 'group_visibility_requires_group'; end if;
  if new.visibility = 'unit_members' and new.unit_id is null then raise exception 'unit_visibility_requires_unit'; end if;
  return new;
end;
$$;
revoke all on function private.validate_event_scope() from public, anon, authenticated;
drop trigger if exists events_validate_scope on public.events;
create trigger events_validate_scope before insert or update of organization_id,unit_id,ministry_id,group_id,visibility
on public.events for each row execute function private.validate_event_scope();

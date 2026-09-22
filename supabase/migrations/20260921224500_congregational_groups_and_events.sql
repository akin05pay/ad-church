-- AD Church 0.9 — congregational groups, ministry participation and agenda.

insert into public.permissions (key, description)
values ('groups.manage', 'Criar e administrar grupos e seus participantes dentro do próprio escopo')
on conflict (key) do update set description = excluded.description;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on p.key = 'groups.manage'
where r.key in (
  'platform_owner','platform_admin','sector_pastor','sector_secretary',
  'local_pastor','local_secretary','ministry_leader'
)
on conflict do nothing;

create table if not exists public.groups (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  unit_id uuid not null references public.units(id) on delete cascade,
  ministry_id uuid references public.ministries(id) on delete set null,
  leader_person_id uuid references public.people(id) on delete set null,
  name text not null,
  slug text not null,
  description text,
  group_type text not null default 'small_group'
    check (group_type in ('small_group','discipleship','ebd','class','committee','other')),
  visibility text not null default 'unit_members'
    check (visibility in ('unit_members','members_only')),
  active boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, unit_id, slug)
);

create index if not exists groups_org_unit_idx on public.groups (organization_id, unit_id, active);
create index if not exists groups_ministry_idx on public.groups (ministry_id) where ministry_id is not null;

create table if not exists public.group_memberships (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  person_id uuid not null references public.people(id) on delete cascade,
  role text not null default 'member' check (role in ('member','helper','leader')),
  status text not null default 'active' check (status in ('pending','active','inactive')),
  joined_at timestamptz not null default now(),
  approved_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (group_id, person_id)
);

create index if not exists group_memberships_person_idx on public.group_memberships (person_id, status);

create table if not exists public.ministry_memberships (
  id uuid primary key default gen_random_uuid(),
  ministry_id uuid not null references public.ministries(id) on delete cascade,
  person_id uuid not null references public.people(id) on delete cascade,
  role text not null default 'member' check (role in ('member','volunteer','leader')),
  status text not null default 'active' check (status in ('pending','active','inactive')),
  joined_at timestamptz not null default now(),
  approved_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (ministry_id, person_id)
);

create index if not exists ministry_memberships_person_idx on public.ministry_memberships (person_id, status);

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  unit_id uuid references public.units(id) on delete cascade,
  ministry_id uuid references public.ministries(id) on delete set null,
  group_id uuid references public.groups(id) on delete set null,
  title text not null,
  description text,
  event_type text not null default 'event'
    check (event_type in ('worship','ebd','meeting','discipleship','ministry','social','event','other')),
  visibility text not null default 'unit_members'
    check (visibility in ('public','organization','unit_members','group_members')),
  starts_at timestamptz not null,
  ends_at timestamptz,
  location_name text,
  address_line text,
  status text not null default 'scheduled'
    check (status in ('scheduled','cancelled','completed')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint events_end_after_start check (ends_at is null or ends_at > starts_at)
);

create index if not exists events_org_starts_idx on public.events (organization_id, starts_at);
create index if not exists events_unit_starts_idx on public.events (unit_id, starts_at) where unit_id is not null;
create index if not exists events_group_starts_idx on public.events (group_id, starts_at) where group_id is not null;

alter table public.groups enable row level security;
alter table public.group_memberships enable row level security;
alter table public.ministry_memberships enable row level security;
alter table public.events enable row level security;

grant select, insert, update, delete on table public.groups to authenticated;
grant select, insert, update, delete on table public.group_memberships to authenticated;
grant select, insert, update, delete on table public.ministry_memberships to authenticated;
grant select on table public.events to anon, authenticated;
grant insert, update, delete on table public.events to authenticated;

create or replace function private.current_person_id() returns uuid language sql stable security definer set search_path = '' as $$
  select pr.person_id from public.profiles pr where pr.user_id = (select auth.uid()) limit 1;
$$;
revoke all on function private.current_person_id() from public, anon, authenticated;
grant execute on function private.current_person_id() to authenticated;

create or replace function private.user_is_group_member(target_group_id uuid) returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.group_memberships gm
    join public.profiles pr on pr.person_id = gm.person_id
    where gm.group_id = target_group_id and gm.status = 'active'
      and pr.user_id = (select auth.uid())
  );
$$;
revoke all on function private.user_is_group_member(uuid) from public, anon, authenticated;
grant execute on function private.user_is_group_member(uuid) to authenticated;

create or replace function private.can_manage_group(target_group_id uuid) returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.groups g
    where g.id = target_group_id
      and private.has_permission('groups.manage', g.organization_id, g.unit_id, g.ministry_id)
  );
$$;
revoke all on function private.can_manage_group(uuid) from public, anon, authenticated;
grant execute on function private.can_manage_group(uuid) to authenticated;

create or replace function private.can_manage_ministry(target_ministry_id uuid) returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.ministries m
    where m.id = target_ministry_id
      and private.has_permission('ministry.manage', m.organization_id, m.unit_id, m.id)
  );
$$;
revoke all on function private.can_manage_ministry(uuid) from public, anon, authenticated;
grant execute on function private.can_manage_ministry(uuid) to authenticated;

create policy "authenticated_can_read_groups" on public.groups for select to authenticated
using (active = true and (
  private.user_has_membership_in_scope(unit_id)
  or private.user_is_group_member(id)
  or private.has_permission('groups.manage', organization_id, unit_id, ministry_id)
));
create policy "authorized_can_manage_groups" on public.groups for all to authenticated
using (private.has_permission('groups.manage', organization_id, unit_id, ministry_id))
with check (private.has_permission('groups.manage', organization_id, unit_id, ministry_id));

create policy "authenticated_can_read_group_memberships" on public.group_memberships for select to authenticated
using (person_id = private.current_person_id() or private.can_manage_group(group_id));
create policy "authorized_can_manage_group_memberships" on public.group_memberships for all to authenticated
using (private.can_manage_group(group_id))
with check (private.can_manage_group(group_id));

create policy "authenticated_can_read_ministry_memberships" on public.ministry_memberships for select to authenticated
using (person_id = private.current_person_id() or private.can_manage_ministry(ministry_id));
create policy "authorized_can_manage_ministry_memberships" on public.ministry_memberships for all to authenticated
using (private.can_manage_ministry(ministry_id))
with check (private.can_manage_ministry(ministry_id));

create policy "public_can_read_public_events" on public.events for select to anon, authenticated
using (visibility = 'public' and status = 'scheduled');
create policy "authenticated_can_read_scoped_events" on public.events for select to authenticated
using (
  status = 'scheduled'
  and (
    visibility = 'public'
    or (visibility = 'organization' and private.user_has_organization_context(organization_id))
    or (visibility = 'unit_members' and unit_id is not null and private.user_has_membership_in_scope(unit_id))
    or (visibility = 'group_members' and group_id is not null and private.user_is_group_member(group_id))
    or private.has_permission('events.manage', organization_id, unit_id, ministry_id)
  )
);
create policy "authorized_can_manage_events" on public.events for all to authenticated
using (private.has_permission('events.manage', organization_id, unit_id, ministry_id))
with check (private.has_permission('events.manage', organization_id, unit_id, ministry_id));

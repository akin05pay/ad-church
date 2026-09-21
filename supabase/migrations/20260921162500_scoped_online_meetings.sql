-- AD Church 0.5 — scoped online meetings foundation.
-- Supports YouTube, Zoom, Google Meet and external providers without storing provider secrets.

insert into public.permissions (key, description)
values ('online.manage', 'Create and manage scoped online meetings and streaming links.')
on conflict (key) do update set description = excluded.description;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on p.key = 'online.manage'
where r.key in (
  'platform_admin',
  'sector_pastor',
  'sector_secretary',
  'local_pastor',
  'local_secretary',
  'ministry_leader'
)
on conflict do nothing;

create table if not exists public.online_meetings (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  unit_id uuid references public.units(id) on delete cascade,
  ministry_id uuid references public.ministries(id) on delete cascade,
  title text not null,
  description text,
  platform text not null check (platform in ('youtube','zoom','google_meet','other')),
  join_url text not null check (join_url ~ '^https://'),
  starts_at timestamptz not null,
  ends_at timestamptz,
  visibility text not null default 'authenticated'
    check (visibility in ('public','authenticated','unit_members')),
  status text not null default 'scheduled'
    check (status in ('scheduled','live','ended','cancelled')),
  active boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint online_meetings_end_after_start
    check (ends_at is null or ends_at > starts_at)
);

create index if not exists online_meetings_org_starts_idx
  on public.online_meetings (organization_id, starts_at);

create index if not exists online_meetings_unit_starts_idx
  on public.online_meetings (unit_id, starts_at)
  where unit_id is not null;

alter table public.online_meetings enable row level security;

grant select on table public.online_meetings to anon, authenticated;
grant insert, update, delete on table public.online_meetings to authenticated;

create or replace function private.user_has_membership_in_scope(target_unit_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles pr
    join public.memberships m on m.person_id = pr.person_id
    where pr.user_id = (select auth.uid())
      and m.status = 'active'
      and (
        target_unit_id is null
        or private.unit_is_within(m.unit_id, target_unit_id)
      )
  );
$$;

revoke all on function private.user_has_membership_in_scope(uuid) from public, anon;
grant execute on function private.user_has_membership_in_scope(uuid) to authenticated;

drop policy if exists "public_can_read_public_online_meetings" on public.online_meetings;
create policy "public_can_read_public_online_meetings"
on public.online_meetings
for select
to anon, authenticated
using (
  active = true
  and visibility = 'public'
  and status in ('scheduled','live')
);

drop policy if exists "authenticated_can_read_online_meetings" on public.online_meetings;
create policy "authenticated_can_read_online_meetings"
on public.online_meetings
for select
to authenticated
using (
  active = true
  and status in ('scheduled','live')
  and (
    visibility in ('public','authenticated')
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

drop policy if exists "authorized_can_manage_online_meetings" on public.online_meetings;
create policy "authorized_can_manage_online_meetings"
on public.online_meetings
for all
to authenticated
using (
  private.has_permission(
    'online.manage',
    organization_id,
    unit_id,
    ministry_id
  )
)
with check (
  private.has_permission(
    'online.manage',
    organization_id,
    unit_id,
    ministry_id
  )
);

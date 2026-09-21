-- AD Church Governance 0.6
-- Hierarchy ceiling, owner role, controlled invitations, approval and moderation.

alter table public.roles
  add column if not exists authority_rank integer not null default 100;

insert into public.roles (key, name, level, authority_rank)
values ('platform_owner', 'Proprietário da plataforma', 'platform', 1000)
on conflict (key) do update
set name = excluded.name,
    level = excluded.level,
    authority_rank = excluded.authority_rank;

update public.roles set authority_rank = case key
  when 'platform_owner' then 1000
  when 'platform_admin' then 900
  when 'sector_pastor' then 800
  when 'sector_secretary' then 700
  when 'local_pastor' then 600
  when 'local_secretary' then 500
  when 'ministry_leader' then 400
  when 'worship_operator' then 300
  when 'member' then 100
  else authority_rank
end;

insert into public.permissions (key, description)
values
  ('team.manage', 'Criar e acompanhar convites de equipe dentro do próprio escopo'),
  ('team.approve', 'Aprovar ou revogar convites de equipe dentro do próprio escopo'),
  ('roles.grant', 'Conceder papéis inferiores ao próprio nível de autoridade'),
  ('members.moderate', 'Suspender, reativar ou revogar vínculos funcionais inferiores')
on conflict (key) do update
set description = excluded.description;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.key in ('platform_owner', 'platform_admin')
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on (
  (r.key = 'sector_pastor' and p.key in ('team.manage','team.approve','roles.grant','members.moderate'))
  or
  (r.key = 'sector_secretary' and p.key in ('team.manage','members.moderate'))
  or
  (r.key = 'local_pastor' and p.key in ('team.manage','team.approve','roles.grant','members.moderate'))
  or
  (r.key = 'local_secretary' and p.key in ('team.manage','members.moderate'))
)
on conflict do nothing;

create table if not exists public.role_invitations (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  role_id uuid not null references public.roles(id) on delete restrict,
  scope_unit_id uuid references public.units(id) on delete cascade,
  scope_ministry_id uuid references public.ministries(id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending','approved','claimed','revoked','expired')),
  created_by uuid not null references auth.users(id) on delete restrict,
  approved_by uuid references auth.users(id) on delete set null,
  claimed_by uuid references auth.users(id) on delete set null,
  expires_at timestamptz not null default (now() + interval '14 days'),
  created_at timestamptz not null default now(),
  approved_at timestamptz,
  claimed_at timestamptz,
  constraint role_invitations_email_normalized check (email = lower(trim(email)))
);

create unique index if not exists role_invitations_open_unique
  on public.role_invitations (
    email,
    organization_id,
    role_id,
    coalesce(scope_unit_id, '00000000-0000-0000-0000-000000000000'::uuid),
    coalesce(scope_ministry_id, '00000000-0000-0000-0000-000000000000'::uuid)
  )
  where status in ('pending','approved');

create index if not exists role_invitations_org_status_idx
  on public.role_invitations (organization_id, status, created_at desc);

alter table public.role_invitations enable row level security;
grant select on table public.role_invitations to authenticated;
revoke insert, update, delete on table public.role_invitations from anon, authenticated;

create or replace function private.role_scope_is_valid(
  target_role_id uuid,
  target_organization_id uuid,
  target_unit_id uuid,
  target_ministry_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.roles r
    where r.id = target_role_id
      and r.key <> 'platform_owner'
      and (
        (r.level = 'platform' and target_unit_id is null and target_ministry_id is null)
        or
        (r.level = 'sector'
          and target_unit_id is not null
          and target_ministry_id is null
          and exists (
            select 1 from public.units u
            where u.id = target_unit_id
              and u.organization_id = target_organization_id
              and u.unit_type in ('sector','field','region')
          ))
        or
        (r.level = 'congregation'
          and target_unit_id is not null
          and target_ministry_id is null
          and exists (
            select 1 from public.units u
            where u.id = target_unit_id
              and u.organization_id = target_organization_id
              and u.unit_type = 'congregation'
          ))
        or
        (r.level = 'ministry'
          and target_unit_id is not null
          and target_ministry_id is not null
          and exists (
            select 1 from public.ministries m
            where m.id = target_ministry_id
              and m.organization_id = target_organization_id
              and m.unit_id = target_unit_id
              and m.active = true
          ))
        or
        (r.level = 'member'
          and target_unit_id is not null
          and target_ministry_id is null
          and exists (
            select 1 from public.units u
            where u.id = target_unit_id
              and u.organization_id = target_organization_id
              and u.unit_type = 'congregation'
          ))
      )
  );
$$;

revoke all on function private.role_scope_is_valid(uuid,uuid,uuid,uuid) from public, anon, authenticated;

create or replace function private.can_act_on_role(
  required_permission text,
  target_role_id uuid,
  target_organization_id uuid,
  target_unit_id uuid,
  target_ministry_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.roles target_role
    where target_role.id = target_role_id
      and target_role.key <> 'platform_owner'
      and private.role_scope_is_valid(
        target_role_id,
        target_organization_id,
        target_unit_id,
        target_ministry_id
      )
      and exists (
        select 1
        from public.role_assignments ra
        join public.roles actor_role on actor_role.id = ra.role_id
        join public.role_permissions rp on rp.role_id = actor_role.id
        join public.permissions p on p.id = rp.permission_id
        where ra.user_id = (select auth.uid())
          and ra.status = 'active'
          and ra.organization_id = target_organization_id
          and p.key = required_permission
          and actor_role.authority_rank > target_role.authority_rank
          and (
            ra.scope_unit_id is null
            or (
              target_unit_id is not null
              and private.unit_is_within(target_unit_id, ra.scope_unit_id)
            )
          )
          and (
            ra.scope_ministry_id is null
            or (
              target_ministry_id is not null
              and ra.scope_ministry_id = target_ministry_id
            )
          )
      )
  );
$$;

revoke all on function private.can_act_on_role(text,uuid,uuid,uuid,uuid) from public, anon, authenticated;

create or replace function private.current_user_email()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select lower(trim(u.email))
  from auth.users u
  where u.id = (select auth.uid());
$$;

revoke all on function private.current_user_email() from public, anon, authenticated;

drop policy if exists "authorized_can_read_role_invitations" on public.role_invitations;
create policy "authorized_can_read_role_invitations"
on public.role_invitations
for select
to authenticated
using (
  email = private.current_user_email()
  or private.can_act_on_role('team.manage', role_id, organization_id, scope_unit_id, scope_ministry_id)
  or private.can_act_on_role('team.approve', role_id, organization_id, scope_unit_id, scope_ministry_id)
);

create or replace function private.create_role_invitation(
  target_email text,
  target_role_id uuid,
  target_organization_id uuid,
  target_unit_id uuid default null,
  target_ministry_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := auth.uid();
  normalized_email text := lower(trim(target_email));
  invitation_id uuid;
  initial_status text;
begin
  if caller is null then raise exception 'not_authenticated'; end if;
  if normalized_email is null or normalized_email = '' or position('@' in normalized_email) < 2 then
    raise exception 'invalid_email';
  end if;

  if not private.can_act_on_role('team.manage', target_role_id, target_organization_id, target_unit_id, target_ministry_id)
     and not private.can_act_on_role('roles.grant', target_role_id, target_organization_id, target_unit_id, target_ministry_id)
  then raise exception 'not_allowed_to_invite'; end if;

  initial_status := case
    when private.can_act_on_role('roles.grant', target_role_id, target_organization_id, target_unit_id, target_ministry_id)
      then 'approved'
    else 'pending'
  end;

  insert into public.role_invitations (
    email, organization_id, role_id, scope_unit_id, scope_ministry_id,
    status, created_by, approved_by, approved_at
  )
  values (
    normalized_email, target_organization_id, target_role_id, target_unit_id, target_ministry_id,
    initial_status, caller,
    case when initial_status = 'approved' then caller else null end,
    case when initial_status = 'approved' then now() else null end
  )
  returning id into invitation_id;

  insert into public.audit_logs (
    organization_id, actor_user_id, action, entity_type, entity_id, metadata
  )
  values (
    target_organization_id, caller, 'role_invitation.created', 'role_invitation', invitation_id::text,
    jsonb_build_object(
      'email', normalized_email, 'role_id', target_role_id,
      'scope_unit_id', target_unit_id, 'scope_ministry_id', target_ministry_id,
      'status', initial_status
    )
  );

  return invitation_id;
end;
$$;

revoke all on function private.create_role_invitation(text,uuid,uuid,uuid,uuid) from public, anon, authenticated;

create or replace function public.create_role_invitation(
  target_email text,
  target_role_id uuid,
  target_organization_id uuid,
  target_unit_id uuid default null,
  target_ministry_id uuid default null
)
returns uuid
language sql
security invoker
set search_path = ''
as $$
  select private.create_role_invitation(
    target_email, target_role_id, target_organization_id, target_unit_id, target_ministry_id
  );
$$;

revoke all on function public.create_role_invitation(text,uuid,uuid,uuid,uuid) from public, anon;
grant execute on function public.create_role_invitation(text,uuid,uuid,uuid,uuid) to authenticated;

create or replace function private.decide_role_invitation(target_invitation_id uuid, decision text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := auth.uid();
  inv public.role_invitations%rowtype;
begin
  if caller is null then raise exception 'not_authenticated'; end if;

  select * into inv
  from public.role_invitations
  where id = target_invitation_id
  for update;

  if not found then raise exception 'invitation_not_found'; end if;
  if decision not in ('approved','revoked') then raise exception 'invalid_decision'; end if;
  if inv.status not in ('pending','approved') then raise exception 'invitation_not_open'; end if;

  if not private.can_act_on_role('roles.grant', inv.role_id, inv.organization_id, inv.scope_unit_id, inv.scope_ministry_id)
  then raise exception 'not_allowed_to_decide'; end if;

  update public.role_invitations
  set status = decision,
      approved_by = case when decision = 'approved' then caller else approved_by end,
      approved_at = case when decision = 'approved' then now() else approved_at end
  where id = target_invitation_id;

  insert into public.audit_logs (
    organization_id, actor_user_id, action, entity_type, entity_id, metadata
  )
  values (
    inv.organization_id, caller,
    case when decision = 'approved' then 'role_invitation.approved' else 'role_invitation.revoked' end,
    'role_invitation', inv.id::text,
    jsonb_build_object(
      'email', inv.email, 'role_id', inv.role_id,
      'scope_unit_id', inv.scope_unit_id, 'scope_ministry_id', inv.scope_ministry_id
    )
  );

  return decision;
end;
$$;

revoke all on function private.decide_role_invitation(uuid,text) from public, anon, authenticated;

create or replace function public.decide_role_invitation(target_invitation_id uuid, decision text)
returns text
language sql
security invoker
set search_path = ''
as $$
  select private.decide_role_invitation(target_invitation_id, decision);
$$;

revoke all on function public.decide_role_invitation(uuid,text) from public, anon;
grant execute on function public.decide_role_invitation(uuid,text) to authenticated;

create or replace function private.claim_role_invitations()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := auth.uid();
  caller_email text;
  inv record;
  claimed_count integer := 0;
  max_rank integer := 0;
begin
  if caller is null then raise exception 'not_authenticated'; end if;

  select lower(trim(u.email))
    into caller_email
  from auth.users u
  where u.id = caller
    and u.email_confirmed_at is not null;

  if caller_email is null then
    return jsonb_build_object('claimed', 0, 'reason', 'email_not_confirmed');
  end if;

  insert into public.profiles(user_id)
  values (caller)
  on conflict (user_id) do nothing;

  for inv in
    select i.*, r.authority_rank
    from public.role_invitations i
    join public.roles r on r.id = i.role_id
    where i.email = caller_email
      and i.status = 'approved'
      and i.expires_at > now()
    order by r.authority_rank desc, i.created_at
    for update of i
  loop
    if not exists (
      select 1
      from public.role_assignments ra
      where ra.user_id = caller
        and ra.role_id = inv.role_id
        and ra.organization_id = inv.organization_id
        and ra.scope_unit_id is not distinct from inv.scope_unit_id
        and ra.scope_ministry_id is not distinct from inv.scope_ministry_id
        and ra.status = 'active'
    ) then
      insert into public.role_assignments (
        user_id, role_id, organization_id, scope_unit_id, scope_ministry_id,
        status, granted_by, granted_at
      )
      values (
        caller, inv.role_id, inv.organization_id, inv.scope_unit_id, inv.scope_ministry_id,
        'active', inv.approved_by, now()
      );
    end if;

    update public.role_invitations
    set status = 'claimed', claimed_by = caller, claimed_at = now()
    where id = inv.id;

    claimed_count := claimed_count + 1;
    max_rank := greatest(max_rank, inv.authority_rank);

    insert into public.audit_logs (
      organization_id, actor_user_id, action, entity_type, entity_id, metadata
    )
    values (
      inv.organization_id, caller, 'role_invitation.claimed', 'role_invitation', inv.id::text,
      jsonb_build_object(
        'role_id', inv.role_id,
        'scope_unit_id', inv.scope_unit_id,
        'scope_ministry_id', inv.scope_ministry_id
      )
    );
  end loop;

  update public.role_invitations
  set status = 'expired'
  where email = caller_email
    and status in ('pending','approved')
    and expires_at <= now();

  return jsonb_build_object('claimed', claimed_count, 'max_authority_rank', max_rank);
end;
$$;

revoke all on function private.claim_role_invitations() from public, anon, authenticated;

create or replace function public.claim_role_invitations()
returns jsonb
language sql
security invoker
set search_path = ''
as $$
  select private.claim_role_invitations();
$$;

revoke all on function public.claim_role_invitations() from public, anon;
grant execute on function public.claim_role_invitations() to authenticated;

create or replace function private.set_role_assignment_status(target_assignment_id uuid, new_status text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := auth.uid();
  target_assignment public.role_assignments%rowtype;
begin
  if caller is null then raise exception 'not_authenticated'; end if;
  if new_status not in ('active','suspended','revoked') then raise exception 'invalid_status'; end if;

  select * into target_assignment
  from public.role_assignments
  where id = target_assignment_id
  for update;

  if not found then raise exception 'assignment_not_found'; end if;
  if target_assignment.user_id = caller then raise exception 'cannot_moderate_self'; end if;

  if not private.can_act_on_role(
    case when new_status = 'active' then 'roles.grant' else 'members.moderate' end,
    target_assignment.role_id,
    target_assignment.organization_id,
    target_assignment.scope_unit_id,
    target_assignment.scope_ministry_id
  ) then raise exception 'not_allowed_to_moderate'; end if;

  update public.role_assignments
  set status = new_status
  where id = target_assignment_id;

  insert into public.audit_logs (
    organization_id, actor_user_id, action, entity_type, entity_id, metadata
  )
  values (
    target_assignment.organization_id, caller, 'role_assignment.' || new_status,
    'role_assignment', target_assignment.id::text,
    jsonb_build_object(
      'target_user_id', target_assignment.user_id,
      'role_id', target_assignment.role_id,
      'scope_unit_id', target_assignment.scope_unit_id,
      'scope_ministry_id', target_assignment.scope_ministry_id
    )
  );

  return new_status;
end;
$$;

revoke all on function private.set_role_assignment_status(uuid,text) from public, anon, authenticated;

create or replace function public.set_role_assignment_status(target_assignment_id uuid, new_status text)
returns text
language sql
security invoker
set search_path = ''
as $$
  select private.set_role_assignment_status(target_assignment_id, new_status);
$$;

revoke all on function public.set_role_assignment_status(uuid,text) from public, anon;
grant execute on function public.set_role_assignment_status(uuid,text) to authenticated;

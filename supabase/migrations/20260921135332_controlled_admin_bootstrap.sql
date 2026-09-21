-- AD Church 0.4.1 — controlled first-administrator bootstrap.
-- Personal bootstrap eligibility is operational data and is not stored in Git.

insert into public.roles (key, name, level)
values ('platform_admin', 'Administrador técnico', 'platform')
on conflict (key) do update
set name = excluded.name,
    level = excluded.level;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.key = 'platform_admin'
on conflict do nothing;

create table if not exists private.bootstrap_admin_claims (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  scope_unit_id uuid references public.units(id) on delete set null,
  role_id uuid not null references public.roles(id) on delete restrict,
  active boolean not null default true,
  claimed_by uuid references auth.users(id) on delete set null,
  claimed_at timestamptz,
  created_at timestamptz not null default now(),
  constraint bootstrap_admin_email_normalized
    check (email = lower(trim(email)))
);

alter table private.bootstrap_admin_claims enable row level security;

revoke all on table private.bootstrap_admin_claims from public, anon, authenticated;

create or replace function private.claim_initial_admin()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := auth.uid();
  caller_email text;
  caller_confirmed timestamptz;
  claim private.bootstrap_admin_claims%rowtype;
begin
  if caller is null then
    raise exception 'not_authenticated';
  end if;

  select lower(trim(u.email)), u.email_confirmed_at
    into caller_email, caller_confirmed
  from auth.users u
  where u.id = caller;

  if caller_email is null then
    return jsonb_build_object('claimed', false, 'reason', 'email_missing');
  end if;

  if caller_confirmed is null then
    return jsonb_build_object('claimed', false, 'reason', 'email_not_confirmed');
  end if;

  select *
    into claim
  from private.bootstrap_admin_claims c
  where c.email = caller_email
    and c.active = true
    and c.claimed_at is null
  for update
  limit 1;

  if not found then
    return jsonb_build_object('claimed', false, 'reason', 'not_eligible');
  end if;

  insert into public.profiles(user_id)
  values (caller)
  on conflict (user_id) do nothing;

  if not exists (
    select 1
    from public.role_assignments ra
    where ra.user_id = caller
      and ra.role_id = claim.role_id
      and ra.organization_id = claim.organization_id
      and ra.scope_unit_id is not distinct from claim.scope_unit_id
      and ra.scope_ministry_id is null
      and ra.status = 'active'
  ) then
    insert into public.role_assignments(
      user_id,
      role_id,
      organization_id,
      scope_unit_id,
      scope_ministry_id,
      status,
      granted_by,
      granted_at
    )
    values (
      caller,
      claim.role_id,
      claim.organization_id,
      claim.scope_unit_id,
      null,
      'active',
      caller,
      now()
    );
  end if;

  update private.bootstrap_admin_claims
  set claimed_by = caller,
      claimed_at = now(),
      active = false
  where id = claim.id;

  insert into public.audit_logs(
    organization_id,
    actor_user_id,
    action,
    entity_type,
    entity_id,
    metadata
  )
  values (
    claim.organization_id,
    caller,
    'bootstrap.admin_claimed',
    'user',
    caller::text,
    jsonb_build_object(
      'role_id', claim.role_id,
      'scope_unit_id', claim.scope_unit_id
    )
  );

  return jsonb_build_object(
    'claimed', true,
    'organization_id', claim.organization_id,
    'scope_unit_id', claim.scope_unit_id,
    'role_id', claim.role_id
  );
end;
$$;

revoke all on function private.claim_initial_admin() from public, anon, authenticated;
grant usage on schema private to authenticated;
grant execute on function private.claim_initial_admin() to authenticated;

create or replace function public.claim_initial_admin()
returns jsonb
language sql
security invoker
set search_path = ''
as $$
  select private.claim_initial_admin();
$$;

revoke all on function public.claim_initial_admin() from public, anon;
grant execute on function public.claim_initial_admin() to authenticated;

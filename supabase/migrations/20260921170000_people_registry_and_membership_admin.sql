-- AD Church People 0.7
-- Scoped people registry and congregational membership administration.

create index if not exists people_org_name_idx
  on public.people (organization_id, lower(full_name));

create index if not exists people_org_email_idx
  on public.people (organization_id, lower(email))
  where email is not null;

create index if not exists memberships_unit_status_idx
  on public.memberships (unit_id, status, membership_type);

create or replace function private.valid_membership_type(value text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select value = any(array['visitor','attendee','convert','member','leader','worker']::text[]);
$$;

revoke all on function private.valid_membership_type(text) from public, anon, authenticated;

create or replace function private.can_manage_person(target_person_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.people p
    join public.memberships m on m.person_id = p.id
    where p.id = target_person_id
      and private.has_permission(
        'people.manage',
        p.organization_id,
        m.unit_id,
        null
      )
  );
$$;

revoke all on function private.can_manage_person(uuid) from public, anon, authenticated;

create or replace function private.list_manageable_people(
  target_organization_id uuid,
  target_unit_id uuid default null,
  search_text text default null,
  result_limit integer default 100
)
returns table (
  person_id uuid,
  full_name text,
  email text,
  phone text,
  birth_date date,
  membership_id uuid,
  unit_id uuid,
  unit_name text,
  membership_type text,
  membership_status text,
  has_user_account boolean,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    p.id,
    p.full_name,
    p.email,
    p.phone,
    p.birth_date,
    m.id,
    m.unit_id,
    u.name,
    m.membership_type,
    m.status,
    exists (
      select 1
      from public.profiles pr
      where pr.person_id = p.id
    ),
    p.created_at
  from public.people p
  join public.memberships m on m.person_id = p.id
  join public.units u on u.id = m.unit_id
  where p.organization_id = target_organization_id
    and u.organization_id = target_organization_id
    and (
      target_unit_id is null
      or private.unit_is_within(m.unit_id, target_unit_id)
    )
    and (
      private.has_permission('people.read', target_organization_id, m.unit_id, null)
      or private.has_permission('people.manage', target_organization_id, m.unit_id, null)
    )
    and (
      search_text is null
      or trim(search_text) = ''
      or p.full_name ilike '%' || trim(search_text) || '%'
      or coalesce(p.email,'') ilike '%' || trim(search_text) || '%'
      or coalesce(p.phone,'') ilike '%' || trim(search_text) || '%'
    )
  order by p.full_name asc, u.name asc
  limit least(greatest(result_limit, 1), 250);
$$;

revoke all on function private.list_manageable_people(uuid,uuid,text,integer)
from public, anon, authenticated;

create or replace function public.list_manageable_people(
  target_organization_id uuid,
  target_unit_id uuid default null,
  search_text text default null,
  result_limit integer default 100
)
returns table (
  person_id uuid,
  full_name text,
  email text,
  phone text,
  birth_date date,
  membership_id uuid,
  unit_id uuid,
  unit_name text,
  membership_type text,
  membership_status text,
  has_user_account boolean,
  created_at timestamptz
)
language sql
security invoker
set search_path = ''
as $$
  select * from private.list_manageable_people(
    target_organization_id,
    target_unit_id,
    search_text,
    result_limit
  );
$$;

revoke all on function public.list_manageable_people(uuid,uuid,text,integer)
from public, anon;
grant execute on function public.list_manageable_people(uuid,uuid,text,integer)
to authenticated;

create or replace function private.create_person_with_membership(
  target_organization_id uuid,
  target_unit_id uuid,
  person_full_name text,
  person_email text default null,
  person_phone text default null,
  person_birth_date date default null,
  target_membership_type text default 'member'
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := auth.uid();
  created_person_id uuid;
  normalized_email text := nullif(lower(trim(person_email)), '');
  normalized_phone text := nullif(trim(person_phone), '');
begin
  if caller is null then raise exception 'not_authenticated'; end if;
  if nullif(trim(person_full_name), '') is null then raise exception 'full_name_required'; end if;
  if not private.valid_membership_type(target_membership_type) then raise exception 'invalid_membership_type'; end if;

  if not exists (
    select 1
    from public.units u
    where u.id = target_unit_id
      and u.organization_id = target_organization_id
      and u.unit_type = 'congregation'
      and u.active = true
  ) then raise exception 'invalid_congregation'; end if;

  if not private.has_permission('people.manage', target_organization_id, target_unit_id, null)
  then raise exception 'people_manage_denied'; end if;

  if normalized_email is not null and exists (
    select 1
    from public.people p
    join public.memberships m on m.person_id = p.id
    where p.organization_id = target_organization_id
      and lower(p.email) = normalized_email
      and m.unit_id = target_unit_id
  ) then raise exception 'person_already_exists_in_congregation'; end if;

  insert into public.people (organization_id, full_name, email, phone, birth_date)
  values (
    target_organization_id,
    trim(person_full_name),
    normalized_email,
    normalized_phone,
    person_birth_date
  )
  returning id into created_person_id;

  insert into public.memberships (
    person_id, unit_id, membership_type, status, approved_by, approved_at
  )
  values (
    created_person_id, target_unit_id, target_membership_type, 'active', caller, now()
  );

  insert into public.audit_logs (
    organization_id, actor_user_id, action, entity_type, entity_id, metadata
  )
  values (
    target_organization_id, caller, 'person.created', 'person', created_person_id::text,
    jsonb_build_object('unit_id', target_unit_id, 'membership_type', target_membership_type)
  );

  return created_person_id;
end;
$$;

revoke all on function private.create_person_with_membership(uuid,uuid,text,text,text,date,text)
from public, anon, authenticated;

create or replace function public.create_person_with_membership(
  target_organization_id uuid,
  target_unit_id uuid,
  person_full_name text,
  person_email text default null,
  person_phone text default null,
  person_birth_date date default null,
  target_membership_type text default 'member'
)
returns uuid
language sql
security invoker
set search_path = ''
as $$
  select private.create_person_with_membership(
    target_organization_id,
    target_unit_id,
    person_full_name,
    person_email,
    person_phone,
    person_birth_date,
    target_membership_type
  );
$$;

revoke all on function public.create_person_with_membership(uuid,uuid,text,text,text,date,text)
from public, anon;
grant execute on function public.create_person_with_membership(uuid,uuid,text,text,text,date,text)
to authenticated;

create or replace function private.update_person_record(
  target_person_id uuid,
  person_full_name text,
  person_email text default null,
  person_phone text default null,
  person_birth_date date default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := auth.uid();
  target_org uuid;
begin
  if caller is null then raise exception 'not_authenticated'; end if;
  if nullif(trim(person_full_name), '') is null then raise exception 'full_name_required'; end if;
  if not private.can_manage_person(target_person_id) then raise exception 'people_manage_denied'; end if;

  select organization_id into target_org
  from public.people
  where id = target_person_id;

  update public.people
  set full_name = trim(person_full_name),
      email = nullif(lower(trim(person_email)), ''),
      phone = nullif(trim(person_phone), ''),
      birth_date = person_birth_date
  where id = target_person_id;

  insert into public.audit_logs (
    organization_id, actor_user_id, action, entity_type, entity_id, metadata
  )
  values (
    target_org, caller, 'person.updated', 'person', target_person_id::text, '{}'::jsonb
  );

  return target_person_id;
end;
$$;

revoke all on function private.update_person_record(uuid,text,text,text,date)
from public, anon, authenticated;

create or replace function public.update_person_record(
  target_person_id uuid,
  person_full_name text,
  person_email text default null,
  person_phone text default null,
  person_birth_date date default null
)
returns uuid
language sql
security invoker
set search_path = ''
as $$
  select private.update_person_record(
    target_person_id,
    person_full_name,
    person_email,
    person_phone,
    person_birth_date
  );
$$;

revoke all on function public.update_person_record(uuid,text,text,text,date)
from public, anon;
grant execute on function public.update_person_record(uuid,text,text,text,date)
to authenticated;

create or replace function private.set_membership_details(
  target_membership_id uuid,
  target_membership_type text,
  target_status text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := auth.uid();
  membership_row public.memberships%rowtype;
  target_org uuid;
begin
  if caller is null then raise exception 'not_authenticated'; end if;
  if not private.valid_membership_type(target_membership_type) then raise exception 'invalid_membership_type'; end if;
  if target_status not in ('pending','active','inactive','rejected') then raise exception 'invalid_membership_status'; end if;

  select * into membership_row
  from public.memberships
  where id = target_membership_id
  for update;

  if not found then raise exception 'membership_not_found'; end if;

  select u.organization_id into target_org
  from public.units u
  where u.id = membership_row.unit_id;

  if not private.has_permission('people.manage', target_org, membership_row.unit_id, null)
  then raise exception 'people_manage_denied'; end if;

  update public.memberships
  set membership_type = target_membership_type,
      status = target_status,
      approved_by = case when target_status = 'active' then caller else approved_by end,
      approved_at = case when target_status = 'active' then now() else approved_at end
  where id = target_membership_id;

  insert into public.audit_logs (
    organization_id, actor_user_id, action, entity_type, entity_id, metadata
  )
  values (
    target_org, caller, 'membership.updated', 'membership', target_membership_id::text,
    jsonb_build_object('membership_type', target_membership_type, 'status', target_status)
  );

  return target_membership_id;
end;
$$;

revoke all on function private.set_membership_details(uuid,text,text)
from public, anon, authenticated;

create or replace function public.set_membership_details(
  target_membership_id uuid,
  target_membership_type text,
  target_status text
)
returns uuid
language sql
security invoker
set search_path = ''
as $$
  select private.set_membership_details(
    target_membership_id,
    target_membership_type,
    target_status
  );
$$;

revoke all on function public.set_membership_details(uuid,text,text)
from public, anon;
grant execute on function public.set_membership_details(uuid,text,text)
to authenticated;

create or replace function private.transfer_membership(
  target_membership_id uuid,
  target_unit_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller uuid := auth.uid();
  membership_row public.memberships%rowtype;
  target_org uuid;
  new_membership_id uuid;
begin
  if caller is null then raise exception 'not_authenticated'; end if;

  select * into membership_row
  from public.memberships
  where id = target_membership_id
  for update;

  if not found then raise exception 'membership_not_found'; end if;

  select u.organization_id into target_org
  from public.units u
  where u.id = membership_row.unit_id;

  if not exists (
    select 1
    from public.units u
    where u.id = target_unit_id
      and u.organization_id = target_org
      and u.unit_type = 'congregation'
      and u.active = true
  ) then raise exception 'invalid_target_congregation'; end if;

  if membership_row.unit_id = target_unit_id then raise exception 'same_congregation'; end if;

  if not private.has_permission('people.manage', target_org, membership_row.unit_id, null)
     or not private.has_permission('people.manage', target_org, target_unit_id, null)
  then raise exception 'transfer_scope_denied'; end if;

  update public.memberships
  set status = 'inactive'
  where id = membership_row.id;

  insert into public.memberships (
    person_id, unit_id, membership_type, status, approved_by, approved_at
  )
  values (
    membership_row.person_id,
    target_unit_id,
    membership_row.membership_type,
    'active',
    caller,
    now()
  )
  on conflict (person_id, unit_id)
  do update set
    membership_type = excluded.membership_type,
    status = 'active',
    approved_by = excluded.approved_by,
    approved_at = excluded.approved_at
  returning id into new_membership_id;

  insert into public.audit_logs (
    organization_id, actor_user_id, action, entity_type, entity_id, metadata
  )
  values (
    target_org, caller, 'membership.transferred', 'membership', new_membership_id::text,
    jsonb_build_object(
      'person_id', membership_row.person_id,
      'from_unit_id', membership_row.unit_id,
      'to_unit_id', target_unit_id,
      'previous_membership_id', membership_row.id
    )
  );

  return new_membership_id;
end;
$$;

revoke all on function private.transfer_membership(uuid,uuid)
from public, anon, authenticated;

create or replace function public.transfer_membership(
  target_membership_id uuid,
  target_unit_id uuid
)
returns uuid
language sql
security invoker
set search_path = ''
as $$
  select private.transfer_membership(target_membership_id, target_unit_id);
$$;

revoke all on function public.transfer_membership(uuid,uuid)
from public, anon;
grant execute on function public.transfer_membership(uuid,uuid)
to authenticated;

-- Foundation 0.3: import staging, member-link requests and hierarchical approval workflow.

alter table public.access_requests
  add column if not exists requested_full_name text,
  add column if not exists requested_email text,
  add column if not exists requested_phone text,
  add column if not exists requested_birth_date date,
  add column if not exists matched_person_id uuid references public.people(id) on delete set null,
  add column if not exists match_status text not null default 'unmatched'
    check (match_status in ('unmatched','suggested','matched','ambiguous','manual_review'));

create index if not exists idx_access_requests_matched_person_id
  on public.access_requests(matched_person_id);

create table if not exists public.import_batches (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  entity_type text not null check (entity_type in ('members','units')),
  source_name text,
  original_filename text,
  status text not null default 'staged'
    check (status in ('staged','processing','ready_for_review','applied','rejected','purged')),
  total_rows integer not null default 0,
  matched_rows integer not null default 0,
  review_rows integer not null default 0,
  rejected_rows integer not null default 0,
  uploaded_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  purged_at timestamptz
);

create table if not exists public.member_import_rows (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references public.import_batches(id) on delete cascade,
  row_number integer not null,
  source_member_code text,
  full_name text not null,
  email text,
  phone text,
  birth_date date,
  unit_name text,
  unit_slug text,
  raw_data jsonb not null default '{}'::jsonb,
  matched_person_id uuid references public.people(id) on delete set null,
  match_status text not null default 'unmatched'
    check (match_status in ('unmatched','exact','ambiguous','manual_review','rejected')),
  match_score integer,
  decision text not null default 'pending'
    check (decision in ('pending','accepted','rejected')),
  decided_by uuid references auth.users(id),
  decided_at timestamptz,
  created_at timestamptz not null default now(),
  unique(batch_id, row_number)
);

create table if not exists public.unit_import_rows (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references public.import_batches(id) on delete cascade,
  row_number integer not null,
  parent_slug text,
  unit_type text not null default 'congregation',
  name text not null,
  slug text,
  address_line text,
  city text,
  state text,
  raw_data jsonb not null default '{}'::jsonb,
  decision text not null default 'pending'
    check (decision in ('pending','accepted','rejected')),
  decided_by uuid references auth.users(id),
  decided_at timestamptz,
  created_at timestamptz not null default now(),
  unique(batch_id, row_number)
);

create index if not exists idx_import_batches_org on public.import_batches(organization_id);
create index if not exists idx_import_batches_uploaded_by on public.import_batches(uploaded_by);
create index if not exists idx_member_import_rows_batch on public.member_import_rows(batch_id);
create index if not exists idx_member_import_rows_email on public.member_import_rows(lower(email));
create index if not exists idx_member_import_rows_matched_person on public.member_import_rows(matched_person_id);
create index if not exists idx_unit_import_rows_batch on public.unit_import_rows(batch_id);

alter table public.import_batches enable row level security;
alter table public.member_import_rows enable row level security;
alter table public.unit_import_rows enable row level security;

create policy "managers_can_read_import_batches" on public.import_batches
for select to authenticated using (
  private.has_permission('people.manage', organization_id, null, null)
  or uploaded_by = (select auth.uid())
);

create policy "managers_can_create_import_batches" on public.import_batches
for insert to authenticated with check (
  uploaded_by = (select auth.uid())
  and private.has_permission('people.manage', organization_id, null, null)
);

create policy "managers_can_update_import_batches" on public.import_batches
for update to authenticated
using (private.has_permission('people.manage', organization_id, null, null))
with check (private.has_permission('people.manage', organization_id, null, null));

create policy "managers_can_read_member_import_rows" on public.member_import_rows
for select to authenticated using (
  exists (
    select 1 from public.import_batches b
    where b.id = member_import_rows.batch_id
      and private.has_permission('people.manage', b.organization_id, null, null)
  )
);

create policy "managers_can_insert_member_import_rows" on public.member_import_rows
for insert to authenticated with check (
  exists (
    select 1 from public.import_batches b
    where b.id = member_import_rows.batch_id
      and b.uploaded_by = (select auth.uid())
      and private.has_permission('people.manage', b.organization_id, null, null)
  )
);

create policy "managers_can_update_member_import_rows" on public.member_import_rows
for update to authenticated
using (
  exists (
    select 1 from public.import_batches b
    where b.id = member_import_rows.batch_id
      and private.has_permission('people.manage', b.organization_id, null, null)
  )
)
with check (
  exists (
    select 1 from public.import_batches b
    where b.id = member_import_rows.batch_id
      and private.has_permission('people.manage', b.organization_id, null, null)
  )
);

create policy "managers_can_read_unit_import_rows" on public.unit_import_rows
for select to authenticated using (
  exists (
    select 1 from public.import_batches b
    where b.id = unit_import_rows.batch_id
      and private.has_permission('people.manage', b.organization_id, null, null)
  )
);

create policy "managers_can_insert_unit_import_rows" on public.unit_import_rows
for insert to authenticated with check (
  exists (
    select 1 from public.import_batches b
    where b.id = unit_import_rows.batch_id
      and b.uploaded_by = (select auth.uid())
      and private.has_permission('people.manage', b.organization_id, null, null)
  )
);

create policy "managers_can_update_unit_import_rows" on public.unit_import_rows
for update to authenticated
using (
  exists (
    select 1 from public.import_batches b
    where b.id = unit_import_rows.batch_id
      and private.has_permission('people.manage', b.organization_id, null, null)
  )
)
with check (
  exists (
    select 1 from public.import_batches b
    where b.id = unit_import_rows.batch_id
      and private.has_permission('people.manage', b.organization_id, null, null)
  )
);

create policy "authenticated_can_read_active_organizations" on public.organizations
for select to authenticated using (true);

create policy "authenticated_can_read_active_units" on public.units
for select to authenticated using (active = true);

create or replace function private.normalize_phone(value text)
returns text language sql immutable set search_path = ''
as $$
  select nullif(regexp_replace(coalesce(value, ''), '[^0-9]', '', 'g'), '');
$$;

create or replace function private.normalize_email(value text)
returns text language sql immutable set search_path = ''
as $$
  select nullif(lower(trim(coalesce(value, ''))), '');
$$;

create or replace function private.normalize_name(value text)
returns text language sql immutable set search_path = ''
as $$
  select nullif(lower(regexp_replace(trim(coalesce(value, '')), '\s+', ' ', 'g')), '');
$$;

revoke all on function private.normalize_phone(text) from public, anon, authenticated;
revoke all on function private.normalize_email(text) from public, anon, authenticated;
revoke all on function private.normalize_name(text) from public, anon, authenticated;

create or replace function private.materialize_access_request_steps()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare
  target_unit_type text;
  inserted_steps integer;
begin
  select u.unit_type into target_unit_type
  from public.units u
  where u.id = new.requested_unit_id;

  insert into public.access_request_steps(access_request_id, step_order, required_role_key)
  select new.id, r.step_order, r.required_approver_role_key
  from public.approval_rules r
  where r.organization_id = new.organization_id
    and r.requested_role_id = new.requested_role_id
    and r.active = true
    and (r.requested_unit_type is null or r.requested_unit_type = target_unit_type)
  order by r.step_order;

  get diagnostics inserted_steps = row_count;

  if inserted_steps = 0 and target_unit_type = 'congregation' then
    insert into public.access_request_steps(access_request_id, step_order, required_role_key)
    values (new.id, 1, 'local_secretary');
  end if;

  return new;
end;
$$;

drop trigger if exists trg_materialize_access_request_steps on public.access_requests;
create trigger trg_materialize_access_request_steps
after insert on public.access_requests
for each row execute function private.materialize_access_request_steps();

revoke all on function private.materialize_access_request_steps() from public, anon, authenticated;

create or replace function private.activate_access_request(target_request_id uuid, actor_user_id uuid)
returns void language plpgsql security definer set search_path = ''
as $$
declare
  req public.access_requests%rowtype;
  person_id uuid;
begin
  select * into req from public.access_requests where id = target_request_id for update;
  if not found then raise exception 'request_not_found'; end if;

  person_id := req.matched_person_id;

  if person_id is null then
    select p.person_id into person_id
    from public.profiles p
    where p.user_id = req.user_id;
  end if;

  if person_id is null then
    insert into public.people(
      organization_id, full_name, email, phone, birth_date
    ) values (
      req.organization_id,
      coalesce(nullif(trim(req.requested_full_name), ''), 'Membro sem nome informado'),
      nullif(trim(req.requested_email), ''),
      nullif(trim(req.requested_phone), ''),
      req.requested_birth_date
    )
    returning id into person_id;

    update public.profiles
      set person_id = person_id
    where user_id = req.user_id;
  end if;

  if req.requested_unit_id is not null then
    insert into public.memberships(
      person_id, unit_id, membership_type, status, approved_by, approved_at
    )
    values (
      person_id, req.requested_unit_id, 'member', 'active', actor_user_id, now()
    )
    on conflict (person_id, unit_id)
    do update set
      status = 'active',
      approved_by = excluded.approved_by,
      approved_at = excluded.approved_at;
  end if;

  insert into public.role_assignments(
    user_id, role_id, organization_id, scope_unit_id, scope_ministry_id,
    status, granted_by, granted_at
  )
  select
    req.user_id, req.requested_role_id, req.organization_id,
    req.requested_unit_id, req.requested_ministry_id,
    'active', actor_user_id, now()
  where not exists (
    select 1 from public.role_assignments ra
    where ra.user_id = req.user_id
      and ra.role_id = req.requested_role_id
      and ra.organization_id = req.organization_id
      and ra.scope_unit_id is not distinct from req.requested_unit_id
      and ra.scope_ministry_id is not distinct from req.requested_ministry_id
      and ra.status = 'active'
  );

  update public.access_requests
  set status = 'approved',
      matched_person_id = person_id,
      match_status = case when matched_person_id is null then 'manual_review' else 'matched' end,
      decided_at = now(),
      decided_by = actor_user_id
  where id = req.id;

  insert into public.audit_logs(
    organization_id, actor_user_id, action, entity_type, entity_id, metadata
  )
  values (
    req.organization_id, actor_user_id, 'access.approved', 'access_request',
    req.id::text, jsonb_build_object('user_id', req.user_id, 'person_id', person_id)
  );
end;
$$;

revoke all on function private.activate_access_request(uuid, uuid) from public, anon, authenticated;

create or replace function public.decide_access_request_step(
  target_request_id uuid,
  decision text
)
returns text language plpgsql security definer set search_path = ''
as $$
declare
  req public.access_requests%rowtype;
  step public.access_request_steps%rowtype;
  caller uuid := auth.uid();
  caller_allowed boolean;
  pending_count integer;
begin
  if caller is null then raise exception 'not_authenticated'; end if;
  if decision not in ('approved','rejected') then raise exception 'invalid_decision'; end if;

  select * into req from public.access_requests where id = target_request_id for update;
  if not found then raise exception 'request_not_found'; end if;
  if req.status <> 'pending' then return req.status; end if;

  select * into step
  from public.access_request_steps s
  where s.access_request_id = req.id and s.status = 'pending'
  order by s.step_order
  limit 1
  for update;

  if not found then raise exception 'approval_step_not_configured'; end if;

  select exists (
    select 1
    from public.role_assignments ra
    join public.roles r on r.id = ra.role_id
    where ra.user_id = caller
      and ra.status = 'active'
      and ra.organization_id = req.organization_id
      and r.key = step.required_role_key
      and (
        ra.scope_unit_id is null
        or req.requested_unit_id is null
        or private.unit_is_within(req.requested_unit_id, ra.scope_unit_id)
      )
      and (
        ra.scope_ministry_id is null
        or ra.scope_ministry_id is not distinct from req.requested_ministry_id
      )
  ) into caller_allowed;

  if not caller_allowed then raise exception 'approval_scope_denied'; end if;

  update public.access_request_steps
  set status = decision,
      decided_by = caller,
      decided_at = now()
  where id = step.id;

  if decision = 'rejected' then
    update public.access_requests
    set status = 'rejected', decided_by = caller, decided_at = now()
    where id = req.id;

    insert into public.audit_logs(
      organization_id, actor_user_id, action, entity_type, entity_id, metadata
    ) values (
      req.organization_id, caller, 'access.rejected', 'access_request',
      req.id::text, jsonb_build_object('step_order', step.step_order)
    );

    return 'rejected';
  end if;

  select count(*) into pending_count
  from public.access_request_steps
  where access_request_id = req.id and status = 'pending';

  if pending_count = 0 then
    perform private.activate_access_request(req.id, caller);
    return 'approved';
  end if;

  insert into public.audit_logs(
    organization_id, actor_user_id, action, entity_type, entity_id, metadata
  ) values (
    req.organization_id, caller, 'access.step_approved', 'access_request',
    req.id::text, jsonb_build_object('step_order', step.step_order)
  );

  return 'pending';
end;
$$;

revoke all on function public.decide_access_request_step(uuid, text) from public, anon;
grant execute on function public.decide_access_request_step(uuid, text) to authenticated;

create or replace function public.reconcile_member_import_batch(target_batch_id uuid)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare
  batch public.import_batches%rowtype;
  row_item public.member_import_rows%rowtype;
  candidate uuid;
  candidate_count integer;
  exact_count integer := 0;
  review_count integer := 0;
begin
  select * into batch from public.import_batches where id = target_batch_id for update;
  if not found then raise exception 'batch_not_found'; end if;

  if not private.has_permission('people.manage', batch.organization_id, null, null) then
    raise exception 'import_scope_denied';
  end if;

  update public.import_batches set status = 'processing' where id = batch.id;

  for row_item in
    select * from public.member_import_rows where batch_id = batch.id order by row_number
  loop
    candidate := null;
    candidate_count := 0;

    select count(*), min(p.id)
      into candidate_count, candidate
    from public.people p
    where p.organization_id = batch.organization_id
      and (
        (private.normalize_email(row_item.email) is not null
          and private.normalize_email(p.email) = private.normalize_email(row_item.email))
        or
        (private.normalize_phone(row_item.phone) is not null
          and private.normalize_phone(p.phone) = private.normalize_phone(row_item.phone))
        or
        (row_item.birth_date is not null
          and p.birth_date = row_item.birth_date
          and private.normalize_name(p.full_name) = private.normalize_name(row_item.full_name))
      );

    if candidate_count = 1 then
      update public.member_import_rows
      set matched_person_id = candidate, match_status = 'exact', match_score = 100
      where id = row_item.id;
      exact_count := exact_count + 1;
    elsif candidate_count > 1 then
      update public.member_import_rows
      set matched_person_id = null, match_status = 'ambiguous', match_score = null
      where id = row_item.id;
      review_count := review_count + 1;
    else
      update public.member_import_rows
      set matched_person_id = null, match_status = 'manual_review', match_score = null
      where id = row_item.id;
      review_count := review_count + 1;
    end if;
  end loop;

  update public.import_batches
  set status = 'ready_for_review',
      matched_rows = exact_count,
      review_rows = review_count,
      completed_at = now()
  where id = batch.id;

  return jsonb_build_object(
    'batch_id', batch.id,
    'matched_rows', exact_count,
    'review_rows', review_count
  );
end;
$$;

revoke all on function public.reconcile_member_import_batch(uuid) from public, anon;
grant execute on function public.reconcile_member_import_batch(uuid) to authenticated;

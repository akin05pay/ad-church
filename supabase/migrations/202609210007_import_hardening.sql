-- Foundation 0.3 hardening: scoped imports, deterministic access matching and explicit apply operations.

alter table public.import_batches
  add column if not exists scope_unit_id uuid references public.units(id) on delete set null;

create index if not exists idx_import_batches_scope_unit_id
  on public.import_batches(scope_unit_id);

drop policy if exists "managers_can_read_import_batches" on public.import_batches;
drop policy if exists "managers_can_create_import_batches" on public.import_batches;
drop policy if exists "managers_can_update_import_batches" on public.import_batches;

create policy "managers_can_read_import_batches" on public.import_batches
for select to authenticated using (
  private.has_permission('people.manage', organization_id, scope_unit_id, null)
  or uploaded_by = (select auth.uid())
);

create policy "managers_can_create_import_batches" on public.import_batches
for insert to authenticated with check (
  uploaded_by = (select auth.uid())
  and private.has_permission('people.manage', organization_id, scope_unit_id, null)
);

create policy "managers_can_update_import_batches" on public.import_batches
for update to authenticated
using (private.has_permission('people.manage', organization_id, scope_unit_id, null))
with check (private.has_permission('people.manage', organization_id, scope_unit_id, null));

drop policy if exists "users_can_create_own_access_requests" on public.access_requests;
create policy "users_can_create_own_member_access_requests" on public.access_requests
for insert to authenticated with check (
  (select auth.uid()) = user_id
  and requested_ministry_id is null
  and exists (
    select 1 from public.roles r
    where r.id = requested_role_id and r.key = 'member'
  )
  and exists (
    select 1 from public.units u
    where u.id = requested_unit_id
      and u.organization_id = access_requests.organization_id
      and u.unit_type = 'congregation'
      and u.active = true
  )
);

create or replace function private.match_access_request_person()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare
  candidate uuid;
  candidate_count integer;
begin
  select count(*), min(p.id)
    into candidate_count, candidate
  from public.people p
  where p.organization_id = new.organization_id
    and (
      (private.normalize_email(new.requested_email) is not null
        and private.normalize_email(p.email) = private.normalize_email(new.requested_email))
      or
      (private.normalize_phone(new.requested_phone) is not null
        and private.normalize_phone(p.phone) = private.normalize_phone(new.requested_phone))
      or
      (new.requested_birth_date is not null
        and p.birth_date = new.requested_birth_date
        and private.normalize_name(p.full_name) = private.normalize_name(new.requested_full_name))
    );

  if candidate_count = 1 then
    new.matched_person_id := candidate;
    new.match_status := 'suggested';
  elsif candidate_count > 1 then
    new.matched_person_id := null;
    new.match_status := 'ambiguous';
  else
    new.matched_person_id := null;
    new.match_status := 'unmatched';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_match_access_request_person on public.access_requests;
create trigger trg_match_access_request_person
before insert on public.access_requests
for each row execute function private.match_access_request_person();

revoke all on function private.match_access_request_person() from public, anon, authenticated;

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

  if not private.has_permission('people.manage', batch.organization_id, batch.scope_unit_id, null) then
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

create or replace function public.apply_member_import_batch(target_batch_id uuid)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare
  batch public.import_batches%rowtype;
  row_item public.member_import_rows%rowtype;
  person_id uuid;
  unit_id uuid;
  applied_count integer := 0;
  caller uuid := auth.uid();
begin
  if caller is null then raise exception 'not_authenticated'; end if;

  select * into batch from public.import_batches where id = target_batch_id for update;
  if not found or batch.entity_type <> 'members' then raise exception 'invalid_batch'; end if;

  if not private.has_permission('people.manage', batch.organization_id, batch.scope_unit_id, null) then
    raise exception 'import_scope_denied';
  end if;

  for row_item in
    select * from public.member_import_rows
    where batch_id = batch.id and decision = 'accepted'
    order by row_number
  loop
    person_id := row_item.matched_person_id;

    if person_id is null then
      insert into public.people(organization_id, full_name, email, phone, birth_date)
      values (
        batch.organization_id,
        row_item.full_name,
        nullif(trim(row_item.email), ''),
        nullif(trim(row_item.phone), ''),
        row_item.birth_date
      )
      returning id into person_id;

      update public.member_import_rows
      set matched_person_id = person_id, match_status = 'exact', match_score = 100
      where id = row_item.id;
    else
      update public.people p
      set email = coalesce(p.email, nullif(trim(row_item.email), '')),
          phone = coalesce(p.phone, nullif(trim(row_item.phone), '')),
          birth_date = coalesce(p.birth_date, row_item.birth_date)
      where p.id = person_id and p.organization_id = batch.organization_id;
    end if;

    unit_id := null;
    select u.id into unit_id
    from public.units u
    where u.organization_id = batch.organization_id
      and u.active = true
      and (
        (row_item.unit_slug is not null and u.slug = row_item.unit_slug)
        or
        (row_item.unit_slug is null and row_item.unit_name is not null
          and lower(u.name) = lower(row_item.unit_name))
      )
    order by case when row_item.unit_slug is not null and u.slug = row_item.unit_slug then 0 else 1 end
    limit 1;

    if unit_id is not null then
      insert into public.memberships(
        person_id, unit_id, membership_type, status, approved_by, approved_at
      )
      values (person_id, unit_id, 'member', 'active', caller, now())
      on conflict (person_id, unit_id)
      do update set status = 'active',
                    approved_by = excluded.approved_by,
                    approved_at = excluded.approved_at;
    end if;

    applied_count := applied_count + 1;
  end loop;

  update public.import_batches
  set status = 'applied', completed_at = now()
  where id = batch.id;

  insert into public.audit_logs(
    organization_id, actor_user_id, action, entity_type, entity_id, metadata
  ) values (
    batch.organization_id, caller, 'import.members_applied', 'import_batch',
    batch.id::text, jsonb_build_object('applied_rows', applied_count)
  );

  return jsonb_build_object('batch_id', batch.id, 'applied_rows', applied_count);
end;
$$;

create or replace function public.apply_unit_import_batch(target_batch_id uuid)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare
  batch public.import_batches%rowtype;
  row_item public.unit_import_rows%rowtype;
  parent_id uuid;
  applied_count integer := 0;
  caller uuid := auth.uid();
begin
  if caller is null then raise exception 'not_authenticated'; end if;

  select * into batch from public.import_batches where id = target_batch_id for update;
  if not found or batch.entity_type <> 'units' then raise exception 'invalid_batch'; end if;

  if not private.has_permission('people.manage', batch.organization_id, batch.scope_unit_id, null) then
    raise exception 'import_scope_denied';
  end if;

  for row_item in
    select * from public.unit_import_rows
    where batch_id = batch.id and decision = 'accepted'
    order by row_number
  loop
    if row_item.slug is null or trim(row_item.slug) = '' then
      raise exception 'unit_slug_required_for_row_%', row_item.row_number;
    end if;

    parent_id := null;
    if row_item.parent_slug is not null and trim(row_item.parent_slug) <> '' then
      select u.id into parent_id
      from public.units u
      where u.organization_id = batch.organization_id
        and u.slug = row_item.parent_slug
      limit 1;
    else
      parent_id := batch.scope_unit_id;
    end if;

    insert into public.units(
      organization_id, parent_unit_id, unit_type, name, slug,
      address_line, city, state, active
    ) values (
      batch.organization_id, parent_id, row_item.unit_type, row_item.name, row_item.slug,
      row_item.address_line, row_item.city, row_item.state, true
    )
    on conflict (organization_id, slug)
    do update set
      parent_unit_id = excluded.parent_unit_id,
      unit_type = excluded.unit_type,
      name = excluded.name,
      address_line = excluded.address_line,
      city = excluded.city,
      state = excluded.state,
      active = true;

    applied_count := applied_count + 1;
  end loop;

  update public.import_batches
  set status = 'applied', completed_at = now()
  where id = batch.id;

  insert into public.audit_logs(
    organization_id, actor_user_id, action, entity_type, entity_id, metadata
  ) values (
    batch.organization_id, caller, 'import.units_applied', 'import_batch',
    batch.id::text, jsonb_build_object('applied_rows', applied_count)
  );

  return jsonb_build_object('batch_id', batch.id, 'applied_rows', applied_count);
end;
$$;

revoke all on function public.apply_member_import_batch(uuid) from public, anon;
revoke all on function public.apply_unit_import_batch(uuid) from public, anon;
grant execute on function public.apply_member_import_batch(uuid) to authenticated;
grant execute on function public.apply_unit_import_batch(uuid) to authenticated;

-- Move authorization helpers out of the exposed public schema and remove SECURITY DEFINER views.
create schema if not exists private;

alter function public.handle_new_auth_user() set schema private;
alter function public.unit_is_within(uuid, uuid) set schema private;
alter function public.has_permission(text, uuid, uuid, uuid) set schema private;

create or replace function private.has_permission(
  permission_key text,
  target_organization_id uuid,
  target_unit_id uuid default null,
  target_ministry_id uuid default null
)
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1
    from public.role_assignments ra
    join public.role_permissions rp on rp.role_id = ra.role_id
    join public.permissions p on p.id = rp.permission_id
    where ra.user_id = (select auth.uid())
      and ra.status = 'active'
      and ra.organization_id = target_organization_id
      and p.key = permission_key
      and (
        ra.scope_ministry_id is null
        or (target_ministry_id is not null and ra.scope_ministry_id = target_ministry_id)
      )
      and (
        ra.scope_unit_id is null
        or (target_unit_id is not null and private.unit_is_within(target_unit_id, ra.scope_unit_id))
      )
  );
$$;

revoke all on schema private from public, anon;
grant usage on schema private to authenticated;
revoke all on function private.handle_new_auth_user() from public, anon, authenticated;
revoke all on function private.unit_is_within(uuid, uuid) from public, anon;
revoke all on function private.has_permission(text, uuid, uuid, uuid) from public, anon;
grant execute on function private.unit_is_within(uuid, uuid) to authenticated;
grant execute on function private.has_permission(text, uuid, uuid, uuid) to authenticated;

drop view if exists public.organization_directory;
drop view if exists public.unit_directory;

create policy "public_can_read_organization_directory" on public.organizations
for select to anon using (true);

create policy "public_can_read_active_unit_directory" on public.units
for select to anon using (active = true);

revoke all on public.organizations from anon;
grant select (id, name, slug) on public.organizations to anon;

revoke all on public.units from anon;
grant select (id, organization_id, parent_unit_id, unit_type, name, slug, address_line, city, state) on public.units to anon;

drop policy if exists "users_can_read_own_person" on public.people;
create policy "users_can_read_own_person" on public.people
for select to authenticated using (
  exists (
    select 1 from public.profiles pr
    where pr.user_id = (select auth.uid()) and pr.person_id = people.id
  )
  or exists (
    select 1 from public.memberships m
    where m.person_id = people.id
      and private.has_permission('people.read', people.organization_id, m.unit_id, null)
  )
);

drop policy if exists "users_can_read_memberships_in_scope" on public.memberships;
create policy "users_can_read_memberships_in_scope" on public.memberships
for select to authenticated using (
  exists (
    select 1 from public.profiles pr
    where pr.user_id = (select auth.uid()) and pr.person_id = memberships.person_id
  )
  or exists (
    select 1 from public.units u
    where u.id = memberships.unit_id
      and private.has_permission('people.read', u.organization_id, memberships.unit_id, null)
  )
);

drop policy if exists "linked_users_can_read_ministries" on public.ministries;
create policy "linked_users_can_read_ministries" on public.ministries
for select to authenticated using (
  exists (
    select 1 from public.profiles pr
    join public.people pe on pe.id = pr.person_id
    where pr.user_id = (select auth.uid()) and pe.organization_id = ministries.organization_id
  )
  or private.has_permission('ministry.manage', ministries.organization_id, ministries.unit_id, ministries.id)
);

drop policy if exists "users_can_read_own_role_assignments" on public.role_assignments;
create policy "users_can_read_own_role_assignments" on public.role_assignments
for select to authenticated using (
  user_id = (select auth.uid())
  or private.has_permission('access.approve', organization_id, scope_unit_id, scope_ministry_id)
);

drop policy if exists "approvers_can_read_access_requests" on public.access_requests;
create policy "approvers_can_read_access_requests" on public.access_requests
for select to authenticated using (
  user_id = (select auth.uid())
  or private.has_permission('access.approve', organization_id, requested_unit_id, requested_ministry_id)
);

drop policy if exists "approvers_can_update_access_requests" on public.access_requests;
create policy "approvers_can_update_access_requests" on public.access_requests
for update to authenticated
using (private.has_permission('access.approve', organization_id, requested_unit_id, requested_ministry_id))
with check (private.has_permission('access.approve', organization_id, requested_unit_id, requested_ministry_id));

drop policy if exists "approvers_can_read_approval_rules" on public.approval_rules;
create policy "approvers_can_read_approval_rules" on public.approval_rules
for select to authenticated using (private.has_permission('access.approve', organization_id, null, null));

drop policy if exists "request_owner_or_approver_can_read_steps" on public.access_request_steps;
create policy "request_owner_or_approver_can_read_steps" on public.access_request_steps
for select to authenticated using (
  exists (
    select 1 from public.access_requests ar
    where ar.id = access_request_steps.access_request_id
      and (
        ar.user_id = (select auth.uid())
        or private.has_permission('access.approve', ar.organization_id, ar.requested_unit_id, ar.requested_ministry_id)
      )
  )
);

drop policy if exists "approvers_can_update_steps" on public.access_request_steps;
create policy "approvers_can_update_steps" on public.access_request_steps
for update to authenticated
using (
  exists (
    select 1 from public.access_requests ar
    where ar.id = access_request_steps.access_request_id
      and private.has_permission('access.approve', ar.organization_id, ar.requested_unit_id, ar.requested_ministry_id)
  )
)
with check (
  exists (
    select 1 from public.access_requests ar
    where ar.id = access_request_steps.access_request_id
      and private.has_permission('access.approve', ar.organization_id, ar.requested_unit_id, ar.requested_ministry_id)
  )
);

drop policy if exists "authorized_can_read_audit_logs" on public.audit_logs;
create policy "authorized_can_read_audit_logs" on public.audit_logs
for select to authenticated using (private.has_permission('reports.read', organization_id, null, null));

drop policy if exists "authorized_can_manage_bible_sources" on public.bible_sources;
create policy "authorized_can_manage_bible_sources" on public.bible_sources
for all to authenticated
using (
  exists (
    select 1 from public.role_assignments ra
    where ra.user_id = (select auth.uid()) and ra.status = 'active'
      and private.has_permission('content.manage', ra.organization_id, ra.scope_unit_id, ra.scope_ministry_id)
  )
)
with check (
  exists (
    select 1 from public.role_assignments ra
    where ra.user_id = (select auth.uid()) and ra.status = 'active'
      and private.has_permission('content.manage', ra.organization_id, ra.scope_unit_id, ra.scope_ministry_id)
  )
);

drop policy if exists "authorized_can_manage_hymnals" on public.hymnals;
create policy "authorized_can_manage_hymnals" on public.hymnals
for all to authenticated
using (
  exists (
    select 1 from public.role_assignments ra
    where ra.user_id = (select auth.uid()) and ra.status = 'active'
      and private.has_permission('content.manage', ra.organization_id, ra.scope_unit_id, ra.scope_ministry_id)
  )
)
with check (
  exists (
    select 1 from public.role_assignments ra
    where ra.user_id = (select auth.uid()) and ra.status = 'active'
      and private.has_permission('content.manage', ra.organization_id, ra.scope_unit_id, ra.scope_ministry_id)
  )
);

drop policy if exists "authorized_can_manage_worship_sessions" on public.worship_sessions;
create policy "authorized_can_manage_worship_sessions" on public.worship_sessions
for all to authenticated
using (
  exists (
    select 1 from public.units u
    where u.id = worship_sessions.unit_id
      and private.has_permission('worship.manage', u.organization_id, worship_sessions.unit_id, null)
  )
)
with check (
  exists (
    select 1 from public.units u
    where u.id = worship_sessions.unit_id
      and private.has_permission('worship.manage', u.organization_id, worship_sessions.unit_id, null)
  )
);

drop policy if exists "authorized_can_manage_worship_items" on public.worship_items;
create policy "authorized_can_manage_worship_items" on public.worship_items
for all to authenticated
using (
  exists (
    select 1 from public.worship_sessions ws
    join public.units u on u.id = ws.unit_id
    where ws.id = worship_items.worship_session_id
      and private.has_permission('worship.manage', u.organization_id, ws.unit_id, null)
  )
)
with check (
  exists (
    select 1 from public.worship_sessions ws
    join public.units u on u.id = ws.unit_id
    where ws.id = worship_items.worship_session_id
      and private.has_permission('worship.manage', u.organization_id, ws.unit_id, null)
  )
);

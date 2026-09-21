-- AD Church authorization foundation.
-- Applied to the isolated ad-church project only.

create index if not exists idx_units_parent_unit_id on public.units(parent_unit_id);
create index if not exists idx_units_organization_id on public.units(organization_id);
create index if not exists idx_people_organization_id on public.people(organization_id);
create index if not exists idx_memberships_unit_id on public.memberships(unit_id);
create index if not exists idx_memberships_person_id on public.memberships(person_id);
create index if not exists idx_memberships_approved_by on public.memberships(approved_by);
create index if not exists idx_ministries_organization_id on public.ministries(organization_id);
create index if not exists idx_ministries_unit_id on public.ministries(unit_id);
create index if not exists idx_role_permissions_permission_id on public.role_permissions(permission_id);
create index if not exists idx_role_assignments_user_id on public.role_assignments(user_id);
create index if not exists idx_role_assignments_role_id on public.role_assignments(role_id);
create index if not exists idx_role_assignments_organization_id on public.role_assignments(organization_id);
create index if not exists idx_role_assignments_scope_unit_id on public.role_assignments(scope_unit_id);
create index if not exists idx_role_assignments_scope_ministry_id on public.role_assignments(scope_ministry_id);
create index if not exists idx_role_assignments_granted_by on public.role_assignments(granted_by);
create index if not exists idx_access_requests_user_id on public.access_requests(user_id);
create index if not exists idx_access_requests_organization_id on public.access_requests(organization_id);
create index if not exists idx_access_requests_requested_role_id on public.access_requests(requested_role_id);
create index if not exists idx_access_requests_requested_unit_id on public.access_requests(requested_unit_id);
create index if not exists idx_access_requests_requested_ministry_id on public.access_requests(requested_ministry_id);
create index if not exists idx_access_requests_decided_by on public.access_requests(decided_by);
create index if not exists idx_approval_rules_requested_role_id on public.approval_rules(requested_role_id);
create index if not exists idx_access_request_steps_request_id on public.access_request_steps(access_request_id);
create index if not exists idx_access_request_steps_decided_by on public.access_request_steps(decided_by);
create index if not exists idx_audit_logs_organization_id on public.audit_logs(organization_id);
create index if not exists idx_audit_logs_actor_user_id on public.audit_logs(actor_user_id);
create index if not exists idx_scripture_passages_source on public.scripture_passages(bible_source_id);
create index if not exists idx_hymns_hymnal_id on public.hymns(hymnal_id);
create index if not exists idx_worship_sessions_unit_id on public.worship_sessions(unit_id);
create index if not exists idx_worship_sessions_created_by on public.worship_sessions(created_by);
create index if not exists idx_worship_items_session on public.worship_items(worship_session_id);
create index if not exists idx_worship_items_scripture on public.worship_items(scripture_passage_id);
create index if not exists idx_worship_items_hymn on public.worship_items(hymn_id);

create or replace function public.handle_new_auth_user()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.profiles (user_id) values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_ad_church on auth.users;
create trigger on_auth_user_created_ad_church
after insert on auth.users
for each row execute function public.handle_new_auth_user();

create or replace function public.unit_is_within(candidate_unit uuid, scope_unit uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  with recursive lineage as (
    select u.id, u.parent_unit_id from public.units u where u.id = candidate_unit
    union all
    select p.id, p.parent_unit_id from public.units p join lineage l on p.id = l.parent_unit_id
  )
  select exists(select 1 from lineage where id = scope_unit);
$$;

create or replace function public.has_permission(
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
        or (target_unit_id is not null and public.unit_is_within(target_unit_id, ra.scope_unit_id))
      )
  );
$$;

revoke all on function public.unit_is_within(uuid, uuid) from public;
revoke all on function public.has_permission(text, uuid, uuid, uuid) from public;
grant execute on function public.unit_is_within(uuid, uuid) to authenticated;
grant execute on function public.has_permission(text, uuid, uuid, uuid) to authenticated;

insert into public.permissions(key, description)
values ('content.manage','Gerenciar conteúdo público autorizado')
on conflict (key) do nothing;

insert into public.role_permissions(role_id, permission_id)
select r.id, p.id from public.roles r cross join public.permissions p
where r.key in ('sector_pastor','sector_secretary')
on conflict do nothing;

insert into public.role_permissions(role_id, permission_id)
select r.id, p.id
from public.roles r join public.permissions p on p.key in (
  'people.read','people.manage','access.approve','events.manage',
  'worship.manage','ministry.manage','reports.read','content.manage'
)
where r.key in ('local_pastor','local_secretary')
on conflict do nothing;

insert into public.role_permissions(role_id, permission_id)
select r.id, p.id
from public.roles r join public.permissions p on p.key in ('events.manage','ministry.manage')
where r.key = 'ministry_leader'
on conflict do nothing;

create or replace view public.organization_directory as
select id, name, slug from public.organizations;

create or replace view public.unit_directory as
select id, organization_id, parent_unit_id, unit_type, name, slug, address_line, city, state
from public.units where active = true;

revoke all on public.organizations from anon;
revoke all on public.units from anon;
grant select on public.organization_directory to anon, authenticated;
grant select on public.unit_directory to anon, authenticated;

create policy "authenticated_can_read_roles" on public.roles
for select to authenticated using (true);

create policy "authenticated_can_read_permissions" on public.permissions
for select to authenticated using (true);

create policy "authenticated_can_read_role_permissions" on public.role_permissions
for select to authenticated using (true);

create policy "linked_users_can_read_organization" on public.organizations
for select to authenticated using (
  exists (
    select 1 from public.profiles pr
    join public.people pe on pe.id = pr.person_id
    where pr.user_id = (select auth.uid()) and pe.organization_id = organizations.id
  )
  or exists (
    select 1 from public.role_assignments ra
    where ra.user_id = (select auth.uid()) and ra.status = 'active'
      and ra.organization_id = organizations.id
  )
);

create policy "linked_users_can_read_units" on public.units
for select to authenticated using (
  exists (
    select 1 from public.profiles pr
    join public.people pe on pe.id = pr.person_id
    where pr.user_id = (select auth.uid()) and pe.organization_id = units.organization_id
  )
  or exists (
    select 1 from public.role_assignments ra
    where ra.user_id = (select auth.uid()) and ra.status = 'active'
      and ra.organization_id = units.organization_id
  )
);

create policy "users_can_read_own_person" on public.people
for select to authenticated using (
  exists (
    select 1 from public.profiles pr
    where pr.user_id = (select auth.uid()) and pr.person_id = people.id
  )
  or exists (
    select 1 from public.memberships m
    where m.person_id = people.id
      and public.has_permission('people.read', people.organization_id, m.unit_id, null)
  )
);

create policy "users_can_read_memberships_in_scope" on public.memberships
for select to authenticated using (
  exists (
    select 1 from public.profiles pr
    where pr.user_id = (select auth.uid()) and pr.person_id = memberships.person_id
  )
  or exists (
    select 1 from public.units u
    where u.id = memberships.unit_id
      and public.has_permission('people.read', u.organization_id, memberships.unit_id, null)
  )
);

create policy "linked_users_can_read_ministries" on public.ministries
for select to authenticated using (
  exists (
    select 1 from public.profiles pr
    join public.people pe on pe.id = pr.person_id
    where pr.user_id = (select auth.uid()) and pe.organization_id = ministries.organization_id
  )
  or public.has_permission('ministry.manage', ministries.organization_id, ministries.unit_id, ministries.id)
);

create policy "users_can_read_own_role_assignments" on public.role_assignments
for select to authenticated using (
  user_id = (select auth.uid())
  or public.has_permission('access.approve', organization_id, scope_unit_id, scope_ministry_id)
);

create policy "approvers_can_read_access_requests" on public.access_requests
for select to authenticated using (
  user_id = (select auth.uid())
  or public.has_permission('access.approve', organization_id, requested_unit_id, requested_ministry_id)
);

create policy "approvers_can_update_access_requests" on public.access_requests
for update to authenticated
using (public.has_permission('access.approve', organization_id, requested_unit_id, requested_ministry_id))
with check (public.has_permission('access.approve', organization_id, requested_unit_id, requested_ministry_id));

create policy "approvers_can_read_approval_rules" on public.approval_rules
for select to authenticated using (
  public.has_permission('access.approve', organization_id, null, null)
);

create policy "request_owner_or_approver_can_read_steps" on public.access_request_steps
for select to authenticated using (
  exists (
    select 1 from public.access_requests ar
    where ar.id = access_request_steps.access_request_id
      and (
        ar.user_id = (select auth.uid())
        or public.has_permission('access.approve', ar.organization_id, ar.requested_unit_id, ar.requested_ministry_id)
      )
  )
);

create policy "approvers_can_update_steps" on public.access_request_steps
for update to authenticated
using (
  exists (
    select 1 from public.access_requests ar
    where ar.id = access_request_steps.access_request_id
      and public.has_permission('access.approve', ar.organization_id, ar.requested_unit_id, ar.requested_ministry_id)
  )
)
with check (
  exists (
    select 1 from public.access_requests ar
    where ar.id = access_request_steps.access_request_id
      and public.has_permission('access.approve', ar.organization_id, ar.requested_unit_id, ar.requested_ministry_id)
  )
);

create policy "authorized_can_read_audit_logs" on public.audit_logs
for select to authenticated using (
  public.has_permission('reports.read', organization_id, null, null)
);

create policy "authorized_can_manage_bible_sources" on public.bible_sources
for all to authenticated
using (
  exists (
    select 1 from public.role_assignments ra
    where ra.user_id = (select auth.uid()) and ra.status = 'active'
      and public.has_permission('content.manage', ra.organization_id, ra.scope_unit_id, ra.scope_ministry_id)
  )
)
with check (
  exists (
    select 1 from public.role_assignments ra
    where ra.user_id = (select auth.uid()) and ra.status = 'active'
      and public.has_permission('content.manage', ra.organization_id, ra.scope_unit_id, ra.scope_ministry_id)
  )
);

create policy "authorized_can_manage_hymnals" on public.hymnals
for all to authenticated
using (
  exists (
    select 1 from public.role_assignments ra
    where ra.user_id = (select auth.uid()) and ra.status = 'active'
      and public.has_permission('content.manage', ra.organization_id, ra.scope_unit_id, ra.scope_ministry_id)
  )
)
with check (
  exists (
    select 1 from public.role_assignments ra
    where ra.user_id = (select auth.uid()) and ra.status = 'active'
      and public.has_permission('content.manage', ra.organization_id, ra.scope_unit_id, ra.scope_ministry_id)
  )
);

create policy "authorized_can_manage_worship_sessions" on public.worship_sessions
for all to authenticated
using (
  exists (
    select 1 from public.units u
    where u.id = worship_sessions.unit_id
      and public.has_permission('worship.manage', u.organization_id, worship_sessions.unit_id, null)
  )
)
with check (
  exists (
    select 1 from public.units u
    where u.id = worship_sessions.unit_id
      and public.has_permission('worship.manage', u.organization_id, worship_sessions.unit_id, null)
  )
);

create policy "authorized_can_manage_worship_items" on public.worship_items
for all to authenticated
using (
  exists (
    select 1 from public.worship_sessions ws
    join public.units u on u.id = ws.unit_id
    where ws.id = worship_items.worship_session_id
      and public.has_permission('worship.manage', u.organization_id, ws.unit_id, null)
  )
)
with check (
  exists (
    select 1 from public.worship_sessions ws
    join public.units u on u.id = ws.unit_id
    where ws.id = worship_items.worship_session_id
      and public.has_permission('worship.manage', u.organization_id, ws.unit_id, null)
  )
);

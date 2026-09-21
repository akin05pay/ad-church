-- Foundation 0.3 security hardening after Supabase advisors.
-- Public RPCs remain callable by authenticated clients but execute as SECURITY INVOKER.
-- Privileged implementations live in the non-exposed private schema.

create index if not exists idx_member_import_rows_decided_by
  on public.member_import_rows(decided_by);

create index if not exists idx_unit_import_rows_decided_by
  on public.unit_import_rows(decided_by);

alter function public.decide_access_request_step(uuid, text) set schema private;
alter function public.reconcile_member_import_batch(uuid) set schema private;
alter function public.apply_member_import_batch(uuid) set schema private;
alter function public.apply_unit_import_batch(uuid) set schema private;

revoke all on function private.decide_access_request_step(uuid, text) from public, anon, authenticated;
revoke all on function private.reconcile_member_import_batch(uuid) from public, anon, authenticated;
revoke all on function private.apply_member_import_batch(uuid) from public, anon, authenticated;
revoke all on function private.apply_unit_import_batch(uuid) from public, anon, authenticated;

create or replace function public.decide_access_request_step(
  target_request_id uuid,
  decision text
)
returns text
language sql
security invoker
set search_path = ''
as $$
  select private.decide_access_request_step(target_request_id, decision);
$$;

create or replace function public.reconcile_member_import_batch(
  target_batch_id uuid
)
returns jsonb
language sql
security invoker
set search_path = ''
as $$
  select private.reconcile_member_import_batch(target_batch_id);
$$;

create or replace function public.apply_member_import_batch(
  target_batch_id uuid
)
returns jsonb
language sql
security invoker
set search_path = ''
as $$
  select private.apply_member_import_batch(target_batch_id);
$$;

create or replace function public.apply_unit_import_batch(
  target_batch_id uuid
)
returns jsonb
language sql
security invoker
set search_path = ''
as $$
  select private.apply_unit_import_batch(target_batch_id);
$$;

-- Authenticated users can call only the invoker wrappers.
-- The wrappers need to invoke the private implementation, but the private schema
-- remains outside the exposed Data API.
grant usage on schema private to authenticated;
grant execute on function private.decide_access_request_step(uuid, text) to authenticated;
grant execute on function private.reconcile_member_import_batch(uuid) to authenticated;
grant execute on function private.apply_member_import_batch(uuid) to authenticated;
grant execute on function private.apply_unit_import_batch(uuid) to authenticated;

revoke all on function public.decide_access_request_step(uuid, text) from public, anon;
revoke all on function public.reconcile_member_import_batch(uuid) from public, anon;
revoke all on function public.apply_member_import_batch(uuid) from public, anon;
revoke all on function public.apply_unit_import_batch(uuid) from public, anon;

grant execute on function public.decide_access_request_step(uuid, text) to authenticated;
grant execute on function public.reconcile_member_import_batch(uuid) to authenticated;
grant execute on function public.apply_member_import_batch(uuid) to authenticated;
grant execute on function public.apply_unit_import_batch(uuid) to authenticated;

-- Defense in depth for the private one-time bootstrap registry.
-- The table is already outside the exposed Data API and privileges are revoked.
-- This explicit restrictive policy also keeps the database linter clean.

drop policy if exists "bootstrap_claims_deny_all" on private.bootstrap_admin_claims;

create policy "bootstrap_claims_deny_all"
on private.bootstrap_admin_claims
as restrictive
for all
to public
using (false)
with check (false);

# Access and approval model

## Public boundary
`/`, `/biblia`, `/hinarios`, `/culto` do not require authentication.

## Private boundary
`/app`, `/admin` require a verified Supabase identity. Data access additionally requires an approved role/membership.

## Approval examples

### Member of Congregation A
1. User signs in.
2. Selects Congregation A.
3. System optionally matches the church directory.
4. Local secretary approves membership.
5. Membership becomes active.

### Ministry leader
1. Existing approved member requests leader role for Ministry X.
2. Ministry/congregational approval step is created.
3. Depending on policy, a second local/sector step may be required.
4. A `role_assignment` is created only after all mandatory steps are approved.

### Sector-wide role
Sector roles must be approved by an authority configured above congregation level. A local approver cannot grant sector-wide access.

## Authorization principle
`role + scope + status`, never `role` alone.

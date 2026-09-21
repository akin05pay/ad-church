# AD Church — Master Spec 0.1

## 1. Product boundary
AD Church is a PWA for public worship-following and authenticated congregational life.

### Public, no login
- Bible reader/search.
- Hymnal search.
- Worship Follow Mode: current scripture/hymn for a live service.

### Authenticated and approved
- My Church.
- Ministries.
- EBD and discipleship.
- Events and schedules.
- Segmented communication.
- Administration.

## 2. Non-negotiable isolation
- AD Church MUST use its own Supabase project.
- Never reuse Agrinvest/Greenvest project IDs, URLs, keys, schema, users, tables, migrations, Storage, Edge Functions or code specific to those products.
- `.env` values for AD Church must be issued only by the AD Church Supabase project.

## 3. Organizational model
Organization → sector/field → congregation → ministry/team/group → person.
A person can belong to a congregation without having a login. A Supabase Auth user can later link to that person.

## 4. Approval hierarchy
Access is not a boolean. It is a role assignment with scope.
Examples:
- Sector pastor: sector scope, including authorized descendants.
- Sector secretary: sector administrative scope.
- Local pastor/secretary: one congregation.
- Ministry leader: one ministry.
- Member: own relationship and public/member content.

New access can require multiple approval steps depending on requested role and scope. Every grant/revoke must be auditable.

## 5. Church registry reconciliation
A future import/reconciliation flow may compare sign-ups with the church's existing member database. Requirements:
- Import only the minimum data needed for matching.
- Never grant privileged roles solely from a self-declared field.
- Exact/strong matches may accelerate review but still follow the configured approval rule.
- Ambiguous matches go to manual review.
- Imported source data and matching decisions are auditable.

## 6. Public worship experience
A worship session can expose a public slug/QR. An authorized operator changes the current scripture or hymn. Anonymous devices receive the live state (Realtime in a later step).

## 7. Content rights
No Bible translation text or hymn lyrics are shipped until the source is verified as public domain, licensed, or accessed through an authorized external API. Metadata and empty placeholders are allowed during development.

## 8. Security
- RLS from the first migration.
- UI visibility never substitutes for database authorization.
- Service-role/secret keys never appear in the browser.
- Publishable key only on the client.
- Admin actions are server-side and audited.
- Private routes are never cached by the PWA service worker.
- Minors' data receives stricter access controls in future modules.

## 9. MVP acceptance
The beta is ready when:
1. Anonymous person opens Bible/Hymnal/Worship Mode without login.
2. User creates/signs into an account.
3. User requests vínculo/access to a congregation.
4. Authorized local approver reviews the request.
5. Approved user sees only the allowed church/ministry data.
6. Cross-congregation API access fails under RLS.
7. Worship operator can publish current scripture/hymn for anonymous followers.

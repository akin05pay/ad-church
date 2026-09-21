# Implementation plan

## Foundation 0.1 — completed
- Next.js App Router skeleton.
- PWA manifest and public-only service-worker cache.
- Public Bible/Hymnal/Worship routes.
- Private route boundary.
- Supabase SSR client scaffolding.
- Versioned migrations.
- Multi-organization/unit/access-request model.

## Foundation 0.2 — completed
- Auth login/signup/logout.
- Hierarchical organization, congregation, ministry, roles and permissions.
- RLS-first authorization.
- Worship Follow Mode with Realtime.
- GitHub CI with TypeScript and production build validation.

## Foundation / Beta 0.3 — completed
- Generic CSV parser with Portuguese/English header aliases.
- Staging batches for congregation and member registries.
- Templates for both official datasets.
- Deterministic member reconciliation.
- Manual review queue before any data is applied.
- Scoped import permissions.
- Self-service member-link request.
- Hierarchical approval-step materialization.
- Database-enforced approval by role and scope.
- Final membership/role activation only after the last approval step.
- Audit logging for approvals and applied imports.

### Waiting only for real church data
When the official congregation/member files arrive, new column names can be mapped as aliases and loaded through the existing staging flow. No architecture rewrite should be necessary.

## Content foundation — completed
- Protestant Bible catalogue: 66 books / 1,189 chapters.
- Public mobile Bible reader.
- BPM registered as public-domain source.
- Bíblia Livre registered as open licensed source.
- ARC registered as license-required source.
- Harpa Cristã registry activated as licensed content supplied by the contracting church.
- PWA/offline foundation.

## Worship 0.4 — completed
- Authorized worship operator console.
- Public session slug/link.
- Scripture/hymn selection.
- Realtime publishing.
- Public mobile follow mode.

## Online bridge 0.5 — in progress
- Public /online hub.
- Official Assembleia de Deus Online / YouTube entry points.
- Zoom / Google Meet / YouTube provider model.
- Scoped online_meetings table.
- Public/authenticated/unit-member visibility.
- online.manage permission with RLS.
- Next: admin publishing console, ministry/group audiences and reminders.

## Governance 0.6 — completed
- Non-delegable platform_owner root role.
- Authority ranking and hierarchy ceiling.
- Scoped admin invitations, approvals and moderation.
- /admin/equipe.
- Audit logging for role grants, suspensions and revocations.

## People administration 0.7 — in progress
- /admin/pessoas.
- Scoped searchable people registry.
- Manual person creation without forcing an auth account.
- Congregational membership type/status administration.
- Transfer between congregations only when the actor can manage both source and destination.
- Audit logging for person and membership mutations.
- Internal RPC entrypoints remain in the private schema and are callable only through authenticated public wrappers.

## Congregational 0.8 — next
- Load 43 official congregations.
- Reconcile member registry.
- My Church.
- Groups and ministry memberships.
- Events.
- EBD/disciple journey.
- Notices.
- Ministry schedules.

## Canonical infrastructure — 2026-09-21

Supabase:
- Dedicated AD Church project.
- Project ref: srrmxusgsgcmiqrbmhfl
- PostgreSQL 17.
- RLS on exposed product tables.
- No Agrinvest/Greenvest reuse.

Vercel:
- Dedicated project: ad-church.
- Git integration: akin05pay/ad-church.
- Production branch: main.

See docs/ROADMAP.md for the product sequence and docs/MOCKUP_REUSE.md for the assembleia.church reuse policy.

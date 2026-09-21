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

## Worship 0.4 — next
- Authorized worship operator console.
- Public session slug/QR.
- Scripture/hymn selection.
- Realtime publishing.
- Offline behavior for licensed content.

## Congregational 0.5
- Events.
- EBD/disciple journey.
- Notices.
- Ministry membership and schedules.

## Canonical infrastructure — 2026-09-21

Supabase:
- Organization: dedicated AD Church Supabase organization
- Project ref: `srrmxusgsgcmiqrbmhfl`
- Region: `us-east-2`
- Plan: Free
- PostgreSQL: 17
- Migrations: foundation through RLS helper hardening
- Public tables: RLS enabled

Vercel:
- Dedicated Vercel account/project: `ad-church`
- Git integration: `akin05pay/ad-church`
- Preview branch: `codex/foundation-0.2`

Isolation:
- No Agrinvest/Greenvest credentials, database, Auth, Storage, Functions, migrations, or project refs may be reused.

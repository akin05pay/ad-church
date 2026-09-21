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
- Dedicated AD Church Supabase project.
- Auth login/signup/logout.
- Hierarchical organization, congregation, ministry, roles and permissions.
- RLS-first authorization.
- Worship Follow Mode with Realtime.
- GitHub CI with TypeScript and production build validation.

## Foundation / Beta 0.3 — prepared before receiving the real spreadsheets
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

### Waiting only for real data
When the official congregation/member files arrive, map any new column names as aliases and load them through the existing staging flow. No architecture rewrite should be necessary.

## Worship 0.4
- Authorized worship operator console.
- Public session slug/QR.
- Licensed Bible/hymnal provider integration.
- Offline strategy for legally distributable content.

## Congregational 0.5
- Events.
- EBD/disciple journey.
- Notices.
- Ministry membership and schedules.

## Remote foundation status — 2026-09-21

- Supabase project: `ad-church`
- Project ref: `lesyrrojusamejgdzfhk`
- Region: `sa-east-1`
- Isolated from Agrinvest/Greenvest.
- Public routes: `/biblia`, `/hinarios`, `/culto`.
- Protected routes: `/app`, `/admin`.
- Import/admin additions are versioned as migrations and must pass CI/security advisors before merge.

# Implementation plan

## Foundation 0.1 — included in this package
- Next.js App Router skeleton.
- PWA manifest and public-only service-worker cache.
- Public Bible/Hymnal/Worship routes.
- Private route boundary.
- Supabase SSR client scaffolding.
- Versioned local Supabase migrations.
- Multi-organization/unit/access-request model.
- No remote database connection.

## Foundation 0.2
- Create dedicated AD Church Supabase project after explicit organization/cost confirmation.
- Apply migrations to local Supabase first.
- Run security/performance advisors.
- Generate TypeScript database types.
- Implement login/signup/magic-link.
- Implement membership request and approval workflow.

## Beta 0.3
- Import 43 congregations from master registry.
- Ministry hierarchy.
- Reconciliation against church-provided member directory.
- RLS permission functions and automated authorization tests.

## Worship 0.4
- Authorized worship operator console.
- Public session slug/QR.
- Supabase Realtime sync for current scripture/hymn.
- Licensed Bible/hymnal provider integration.
- Offline strategy for legally distributable content.

## Congregational 0.5
- Events.
- EBD/disciple journey.
- Notices.
- Ministry membership and schedules.

## Remote foundation status — 2026-09-20

- Supabase project: `ad-church`
- Project ref: `lesyrrojusamejgdzfhk`
- Region: `sa-east-1`
- This project is isolated from Agrinvest/Greenvest. No database, Auth users, Storage, Functions, keys or migrations are shared.
- Security advisor after hardening: zero security lints.
- Public routes: `/biblia`, `/hinarios`, `/culto`.
- Protected routes: `/app`, `/admin`.
- Worship Realtime is enabled only for `worship_sessions` and `worship_items`.

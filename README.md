# AD Church

Multi-congregational PWA for public worship participation and authenticated church life.

## Public routes

- `/`
- `/biblia`
- `/hinarios`
- `/culto`

## Private routes

- `/app`
- `/admin`

## Canonical infrastructure

### Supabase

AD Church uses one isolated Supabase project owned by the dedicated AD Church account/organization:

- Project ref: `srrmxusgsgcmiqrbmhfl`
- Region: `us-east-2`
- PostgreSQL: 17
- GitHub repository: `akin05pay/ad-church`

This is the canonical backend for AD Church.

Never point AD Church at any Agrinvest/Greenvest project, database, Auth tenant, Storage bucket, Edge Function, API key, migration history, or environment variable.

### Vercel

The application is connected through the Vercel Git integration to the dedicated Vercel account/project:

- Project: `ad-church`
- Repository: `akin05pay/ad-church`
- Preview branch: `codex/foundation-0.2`

The stable `ad-church.vercel.app` alias remains tied to production. Branch previews are used for review before promotion.

## Environment variables

Real values are intentionally not committed.

Required in local development and Vercel:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

Both values must come from Supabase project `srrmxusgsgcmiqrbmhfl` only.

## Database

The schema is versioned in `supabase/migrations`.

Current foundation includes:

- organizations and hierarchical units;
- people, profiles and memberships;
- roles, permissions and scoped role assignments;
- access requests and approval workflows;
- ministries;
- audit logs;
- Bible source registry;
- hymnals and hymns;
- worship sessions/items with Realtime;
- member/congregation import staging and reconciliation.

Generated database types live in:

```text
lib/supabase/database.types.ts
```

Regenerate them after schema changes.

## Local setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

For local Supabase CLI/Docker development:

```bash
supabase start
supabase db reset
```

Read `docs/MASTER_SPEC.md`, `docs/ACCESS_MODEL.md`, and `docs/IMPORT_PIPELINE.md` before implementing new modules.

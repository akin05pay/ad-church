# AD Church

Foundation for a multi-congregational PWA with a public worship layer and an authenticated church-management layer.

## Public routes

- `/biblia`
- `/hinarios`
- `/culto`

## Private routes

- `/app`
- `/admin`

## Supabase

AD Church uses its own isolated Supabase project:

- Project: `ad-church`
- Project ref: `lesyrrojusamejgdzfhk`
- Region: `sa-east-1`

The application must never use Agrinvest/Greenvest credentials, tables, Auth users, Storage, Functions, migrations or project identifiers.

Real environment values are intentionally excluded from Git. Copy `.env.example` to `.env.local` and provide only the AD Church Supabase URL and publishable key.

Local database workflow after installing Supabase CLI and Docker:

```bash
supabase start
supabase db reset
```

App setup:

```bash
npm install
cp .env.example .env.local
npm run dev
```

The migrations in `supabase/migrations` mirror the current AD Church foundation. Read `docs/MASTER_SPEC.md` before implementing new modules.

# AD Church — Infrastructure source of truth

Last reviewed: 2026-09-21

## Ownership boundary

AD Church now uses dedicated accounts for deployment and backend infrastructure.

### GitHub
Repository:
`akin05pay/ad-church`

Development branch:
`codex/foundation-0.2`

### Supabase
Canonical project ref:
`srrmxusgsgcmiqrbmhfl`

Canonical API URL:
`https://srrmxusgsgcmiqrbmhfl.supabase.co`

Region:
`us-east-2`

The browser must use only a publishable Supabase key from this project.

### Vercel
Project:
`ad-church`

Git integration:
`akin05pay/ad-church`

Environment variables required:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

Do not commit actual environment values.

## Isolation invariant

AD Church must never read from, write to, authenticate against, migrate, or deploy resources belonging to Agrinvest/Greenvest.

A code review should reject:
- any unrelated Supabase project ref;
- any unrelated database URL;
- any service-role/secret key in browser code;
- any environment variable copied from another product;
- cross-project Auth or Storage use.

## Promotion flow

`feature/development branch → Vercel Preview → review → merge → production`

The public site must remain buildable even when Supabase environment variables are absent. Auth and Realtime are enabled only when canonical variables are present.

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

The browser uses only the publishable key from this project. The canonical public URL/key are encoded as safe client defaults; environment variables may override them for controlled development.

### Vercel
Project:
`ad-church`

Git integration:
`akin05pay/ad-church`

Environment variables required:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

Never commit secret/service-role values. The project URL and publishable key are public client configuration and have canonical fallbacks in `lib/supabase/config.ts`.

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

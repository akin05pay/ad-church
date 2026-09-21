-- Public Bible/hymnal metadata and worship-follow mode.
-- No copyrighted Bible text or hymn lyrics are seeded here.

create table public.bible_sources (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  abbreviation text not null unique,
  language text not null default 'pt-BR',
  provider text,
  license_status text not null default 'pending' check (license_status in ('pending','public_domain','licensed','external_api')),
  license_reference text,
  active boolean not null default false
);

create table public.scripture_passages (
  id uuid primary key default gen_random_uuid(),
  bible_source_id uuid not null references public.bible_sources(id) on delete cascade,
  book text not null,
  chapter integer not null check (chapter > 0),
  verse_start integer,
  verse_end integer,
  content_text text,
  external_reference text,
  is_public boolean not null default false
);

create table public.hymnals (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  publisher text,
  license_status text not null default 'pending' check (license_status in ('pending','public_domain','licensed','external_api')),
  license_reference text,
  active boolean not null default false
);

create table public.hymns (
  id uuid primary key default gen_random_uuid(),
  hymnal_id uuid not null references public.hymnals(id) on delete cascade,
  hymn_number integer,
  title text not null,
  lyrics_text text,
  external_reference text,
  is_public boolean not null default false,
  unique (hymnal_id, hymn_number)
);

create table public.worship_sessions (
  id uuid primary key default gen_random_uuid(),
  unit_id uuid not null references public.units(id) on delete cascade,
  title text not null,
  starts_at timestamptz not null,
  ends_at timestamptz,
  public_slug text not null unique,
  status text not null default 'scheduled' check (status in ('scheduled','live','ended','cancelled')),
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table public.worship_items (
  id uuid primary key default gen_random_uuid(),
  worship_session_id uuid not null references public.worship_sessions(id) on delete cascade,
  item_type text not null check (item_type in ('scripture','hymn','notice')),
  scripture_passage_id uuid references public.scripture_passages(id),
  hymn_id uuid references public.hymns(id),
  label text,
  sequence integer not null default 1,
  is_current boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.bible_sources enable row level security;
alter table public.scripture_passages enable row level security;
alter table public.hymnals enable row level security;
alter table public.hymns enable row level security;
alter table public.worship_sessions enable row level security;
alter table public.worship_items enable row level security;

create policy "public_can_read_active_bible_sources" on public.bible_sources
for select to anon, authenticated using (active = true and license_status <> 'pending');

create policy "public_can_read_public_scripture" on public.scripture_passages
for select to anon, authenticated using (is_public = true);

create policy "public_can_read_active_hymnals" on public.hymnals
for select to anon, authenticated using (active = true and license_status <> 'pending');

create policy "public_can_read_public_hymns" on public.hymns
for select to anon, authenticated using (is_public = true);

create policy "public_can_read_live_worship_sessions" on public.worship_sessions
for select to anon, authenticated using (status = 'live');

create policy "public_can_read_live_worship_items" on public.worship_items
for select to anon, authenticated using (
  exists (
    select 1 from public.worship_sessions ws
    where ws.id = worship_session_id and ws.status = 'live'
  )
);

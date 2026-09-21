-- AD Church Worship 0.4 bootstrap.
-- Adds an explicit worship operator role and seeds a real public demo session.
-- No copyrighted hymn lyrics or protected Bible text are inserted.

insert into public.roles (key, name, level)
values ('worship_operator', 'Operador de culto', 'congregation')
on conflict (key) do update
set name = excluded.name,
    level = excluded.level;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on p.key in ('worship.manage', 'content.manage')
where r.key = 'worship_operator'
on conflict do nothing;

insert into public.organizations (name, slug)
values ('Assembleia de Deus - Ministério do Belém', 'ad-belem')
on conflict (slug) do update
set name = excluded.name;

with org as (
  select id from public.organizations where slug = 'ad-belem'
)
insert into public.units (
  organization_id, parent_unit_id, unit_type, name, slug, city, state, active
)
select
  org.id, null, 'sector', 'Setor 04 Santana', 'setor-04-santana', 'São Paulo', 'SP', true
from org
on conflict (organization_id, slug) do update
set name = excluded.name,
    unit_type = excluded.unit_type,
    active = true;

with org as (
  select id from public.organizations where slug = 'ad-belem'
),
sector as (
  select u.id, u.organization_id
  from public.units u
  join org on org.id = u.organization_id
  where u.slug = 'setor-04-santana'
)
insert into public.units (
  organization_id, parent_unit_id, unit_type, name, slug, city, state, active
)
select
  sector.organization_id,
  sector.id,
  'congregation',
  'Sede - Setor 04 Santana',
  'sede-setor-04-santana',
  'São Paulo',
  'SP',
  true
from sector
on conflict (organization_id, slug) do update
set parent_unit_id = excluded.parent_unit_id,
    name = excluded.name,
    unit_type = excluded.unit_type,
    active = true;

with source as (
  select id from public.bible_sources where abbreviation = 'BPM' limit 1
)
insert into public.scripture_passages (
  bible_source_id, book, chapter, verse_start, verse_end,
  content_text, external_reference, is_public
)
select
  source.id,
  'João',
  3,
  16,
  16,
  null,
  '/biblia/john/3?v=16',
  true
from source
where not exists (
  select 1
  from public.scripture_passages sp
  where sp.bible_source_id = source.id
    and sp.book = 'João'
    and sp.chapter = 3
    and sp.verse_start = 16
    and coalesce(sp.verse_end, 16) = 16
);

with harpa as (
  select id from public.hymnals where lower(name) = lower('Harpa Cristã') limit 1
)
insert into public.hymns (
  hymnal_id, hymn_number, title, lyrics_text, external_reference, is_public
)
select
  harpa.id,
  291,
  'A Mensagem da Cruz',
  null,
  '/hinarios?numero=291',
  true
from harpa
on conflict (hymnal_id, hymn_number) do update
set title = excluded.title,
    external_reference = excluded.external_reference,
    is_public = true;

with sede as (
  select u.id
  from public.units u
  join public.organizations o on o.id = u.organization_id
  where o.slug = 'ad-belem'
    and u.slug = 'sede-setor-04-santana'
)
insert into public.worship_sessions (
  unit_id, title, starts_at, public_slug, status, created_by
)
select
  sede.id,
  'Culto de Celebração - Demonstração',
  now(),
  'culto-demo-setor-04',
  'live',
  null
from sede
where not exists (
  select 1 from public.worship_sessions ws
  where ws.public_slug = 'culto-demo-setor-04'
);

with session as (
  select id from public.worship_sessions where public_slug = 'culto-demo-setor-04'
),
passage as (
  select sp.id
  from public.scripture_passages sp
  join public.bible_sources bs on bs.id = sp.bible_source_id
  where bs.abbreviation = 'BPM'
    and sp.book = 'João'
    and sp.chapter = 3
    and sp.verse_start = 16
  order by sp.id
  limit 1
)
insert into public.worship_items (
  worship_session_id, item_type, scripture_passage_id, label, sequence, is_current
)
select
  session.id,
  'scripture',
  passage.id,
  'João 3:16',
  1,
  true
from session, passage
where not exists (
  select 1 from public.worship_items wi
  where wi.worship_session_id = session.id
    and wi.item_type = 'scripture'
    and wi.is_current = true
);

with session as (
  select id from public.worship_sessions where public_slug = 'culto-demo-setor-04'
),
hymn as (
  select h.id
  from public.hymns h
  join public.hymnals hy on hy.id = h.hymnal_id
  where lower(hy.name) = lower('Harpa Cristã')
    and h.hymn_number = 291
  limit 1
)
insert into public.worship_items (
  worship_session_id, item_type, hymn_id, label, sequence, is_current
)
select
  session.id,
  'hymn',
  hymn.id,
  'Harpa Cristã 291',
  2,
  true
from session, hymn
where not exists (
  select 1 from public.worship_items wi
  where wi.worship_session_id = session.id
    and wi.item_type = 'hymn'
    and wi.is_current = true
);

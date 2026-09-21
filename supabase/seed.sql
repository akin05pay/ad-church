-- Local-only demo data. Never use real member information in seed files.
insert into public.organizations (id, name, slug)
values ('00000000-0000-0000-0000-000000000001', 'Assembleia Demo', 'assembleia-demo');

insert into public.units (id, organization_id, parent_unit_id, unit_type, name, slug, city, state)
values
('00000000-0000-0000-0000-000000000010','00000000-0000-0000-0000-000000000001',null,'sector','Setor Demo','setor-demo','São Paulo','SP'),
('00000000-0000-0000-0000-000000000011','00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000010','congregation','Congregação Central','central','São Paulo','SP'),
('00000000-0000-0000-0000-000000000012','00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000010','congregation','Congregação Norte','norte','São Paulo','SP');

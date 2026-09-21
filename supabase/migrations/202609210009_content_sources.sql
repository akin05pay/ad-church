-- Content registry for Bible translations and the Harpa Cristã.
-- No copyrighted Bible text or hymn lyrics are inserted here.

insert into public.bible_sources (
  name, abbreviation, language, provider, license_status, license_reference, active
)
values (
  'Bíblia Portuguesa Mundial',
  'BPM',
  'pt-BR',
  'eBible.org / Free.Bible',
  'public_domain',
  'https://ebible.org/porbrbsl/copyright.htm',
  true
)
on conflict (abbreviation) do update set
  name = excluded.name,
  language = excluded.language,
  provider = excluded.provider,
  license_status = excluded.license_status,
  license_reference = excluded.license_reference,
  active = true;

insert into public.bible_sources (
  name, abbreviation, language, provider, license_status, license_reference, active
)
values (
  'Bíblia Livre',
  'BLIVRE',
  'pt-BR',
  'eBible.org',
  'licensed',
  'CC BY 4.0 Brasil — https://ebible.org/porbr2018/copyright.htm',
  false
)
on conflict (abbreviation) do update set
  license_status = excluded.license_status,
  license_reference = excluded.license_reference,
  active = false;

insert into public.bible_sources (
  name, abbreviation, language, provider, license_status, license_reference, active
)
values (
  'Almeida Revista e Corrigida',
  'ARC',
  'pt-BR',
  'Sociedade Bíblica do Brasil',
  'pending',
  'Copyright © 1995, 2009 Sociedade Bíblica do Brasil',
  false
)
on conflict (abbreviation) do update set
  provider = excluded.provider,
  license_status = excluded.license_status,
  license_reference = excluded.license_reference,
  active = false;

insert into public.hymnals (
  name, publisher, license_status, license_reference, active
)
select
  'Harpa Cristã',
  'CPAD — Casa Publicadora das Assembleias de Deus',
  'pending',
  'Licença de conteúdo integral pendente de validação/autorização.',
  false
where not exists (
  select 1 from public.hymnals where lower(name) = lower('Harpa Cristã')
);

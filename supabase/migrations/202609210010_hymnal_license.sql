-- Contracting church confirmed that the supplied Harpa Cristã content is licensed for this project.
-- This migration changes only the AD Church content registry; it does not copy lyrics.

update public.hymnals
set license_status = 'licensed',
    license_reference = 'Licensed content supplied by the contracting church for AD Church; source document received in project.',
    active = true
where lower(name) = lower('Harpa Cristã');

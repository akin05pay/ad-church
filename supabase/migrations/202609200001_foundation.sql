-- AD Church foundation. This migration is intentionally independent from all other products.

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default now()
);

create table public.units (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  parent_unit_id uuid references public.units(id) on delete cascade,
  unit_type text not null check (unit_type in ('headquarters','sector','field','congregation','other')),
  name text not null,
  slug text not null,
  address_line text,
  city text,
  state text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (organization_id, slug)
);

create table public.people (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  full_name text not null,
  email text,
  phone text,
  birth_date date,
  created_at timestamptz not null default now()
);

create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  person_id uuid unique references public.people(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.memberships (
  id uuid primary key default gen_random_uuid(),
  person_id uuid not null references public.people(id) on delete cascade,
  unit_id uuid not null references public.units(id) on delete cascade,
  membership_type text not null default 'attendee' check (membership_type in ('visitor','attendee','convert','member','leader','worker')),
  status text not null default 'pending' check (status in ('pending','active','inactive','rejected')),
  approved_by uuid references auth.users(id),
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  unique (person_id, unit_id)
);

create table public.roles (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  name text not null,
  level text not null check (level in ('platform','organization','sector','congregation','ministry','member'))
);

create table public.permissions (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  description text not null
);

create table public.role_permissions (
  role_id uuid not null references public.roles(id) on delete cascade,
  permission_id uuid not null references public.permissions(id) on delete cascade,
  primary key (role_id, permission_id)
);

create table public.ministries (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  unit_id uuid not null references public.units(id) on delete cascade,
  name text not null,
  slug text not null,
  active boolean not null default true,
  unique (unit_id, slug)
);

create table public.role_assignments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role_id uuid not null references public.roles(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  scope_unit_id uuid references public.units(id) on delete cascade,
  scope_ministry_id uuid references public.ministries(id) on delete cascade,
  status text not null default 'active' check (status in ('active','suspended','revoked')),
  granted_by uuid references auth.users(id),
  granted_at timestamptz not null default now()
);

create table public.access_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  requested_role_id uuid not null references public.roles(id),
  requested_unit_id uuid references public.units(id),
  requested_ministry_id uuid references public.ministries(id),
  reason text,
  status text not null default 'pending' check (status in ('pending','approved','rejected','cancelled')),
  created_at timestamptz not null default now(),
  decided_at timestamptz,
  decided_by uuid references auth.users(id)
);

create table public.approval_rules (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  requested_role_id uuid not null references public.roles(id) on delete cascade,
  requested_unit_type text,
  step_order integer not null check (step_order > 0),
  required_approver_role_key text not null,
  active boolean not null default true,
  unique (organization_id, requested_role_id, requested_unit_type, step_order)
);

create table public.access_request_steps (
  id uuid primary key default gen_random_uuid(),
  access_request_id uuid not null references public.access_requests(id) on delete cascade,
  step_order integer not null check (step_order > 0),
  required_role_key text not null,
  status text not null default 'pending' check (status in ('pending','approved','rejected','skipped')),
  decided_by uuid references auth.users(id),
  decided_at timestamptz,
  unique (access_request_id, step_order)
);

create table public.audit_logs (
  id bigint generated always as identity primary key,
  organization_id uuid references public.organizations(id) on delete set null,
  actor_user_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

insert into public.permissions (key, description) values
('people.read','Consultar pessoas dentro do escopo'),
('people.manage','Gerenciar pessoas dentro do escopo'),
('access.approve','Aprovar solicitações de acesso'),
('events.manage','Gerenciar agenda e eventos'),
('worship.manage','Controlar o modo culto público'),
('ministry.manage','Gerenciar ministério dentro do escopo'),
('reports.read','Consultar relatórios autorizados');

insert into public.roles (key, name, level) values
('sector_pastor','Pastor setorial','sector'),
('sector_secretary','Secretaria setorial','sector'),
('local_pastor','Pastor local','congregation'),
('local_secretary','Secretaria local','congregation'),
('ministry_leader','Líder de ministério','ministry'),
('member','Membro','member');

-- RLS is enabled from the first migration. Policies stay conservative until the auth workflows are connected.
alter table public.organizations enable row level security;
alter table public.units enable row level security;
alter table public.people enable row level security;
alter table public.profiles enable row level security;
alter table public.memberships enable row level security;
alter table public.roles enable row level security;
alter table public.permissions enable row level security;
alter table public.role_permissions enable row level security;
alter table public.ministries enable row level security;
alter table public.role_assignments enable row level security;
alter table public.access_requests enable row level security;
alter table public.approval_rules enable row level security;
alter table public.access_request_steps enable row level security;
alter table public.audit_logs enable row level security;

create policy "users_can_read_own_profile" on public.profiles
for select to authenticated using ((select auth.uid()) = user_id);

create policy "users_can_read_own_access_requests" on public.access_requests
for select to authenticated using ((select auth.uid()) = user_id);

create policy "users_can_create_own_access_requests" on public.access_requests
for insert to authenticated with check ((select auth.uid()) = user_id);

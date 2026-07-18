begin;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email citext,
  display_name text,
  avatar_url text,
  locale text not null default 'ru',
  timezone text not null default 'UTC',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete restrict,
  name text not null,
  slug text not null unique,
  logo_path text,
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint organizations_name_not_blank check (length(trim(name)) > 0),
  constraint organizations_slug_format check (slug ~ '^[a-z0-9][a-z0-9-]{2,63}$'),
  constraint organizations_settings_object check (jsonb_typeof(settings) = 'object')
);

create table if not exists public.organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role public.organization_role not null default 'viewer',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, user_id)
);

create table if not exists public.audit_logs (
  id bigint generated always as identity primary key,
  organization_id uuid references public.organizations(id) on delete cascade,
  actor_user_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint audit_logs_metadata_object check (jsonb_typeof(metadata) = 'object')
);

create index if not exists organization_members_user_idx
  on public.organization_members(user_id);

create index if not exists organization_members_org_role_idx
  on public.organization_members(organization_id, role);

create index if not exists audit_logs_org_created_idx
  on public.audit_logs(organization_id, created_at desc);

commit;

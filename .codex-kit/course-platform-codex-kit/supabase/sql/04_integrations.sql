begin;

create table if not exists public.integration_clients (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  created_by uuid not null references public.profiles(id) on delete restrict,
  name text not null,
  slug text not null,
  status public.integration_status not null default 'active',
  allowed_origins text[] not null default '{}',
  webhook_url text,
  webhook_secret_ciphertext text,
  webhook_secret_hint text,
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, slug),
  constraint integration_clients_name_not_blank check (length(trim(name)) > 0),
  constraint integration_clients_slug_format check (slug ~ '^[a-z0-9][a-z0-9-]{1,99}$'),
  constraint integration_clients_settings_object check (jsonb_typeof(settings) = 'object')
);

create table if not exists public.integration_course_access (
  id uuid primary key default gen_random_uuid(),
  integration_id uuid not null references public.integration_clients(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  access_level text not null default 'launch',
  created_at timestamptz not null default now(),
  unique (integration_id, course_id),
  constraint integration_course_access_level_check check (access_level in ('read', 'launch'))
);

create table if not exists public.integration_api_keys (
  id uuid primary key default gen_random_uuid(),
  integration_id uuid not null references public.integration_clients(id) on delete cascade,
  name text not null,
  key_prefix text not null,
  key_hash text not null unique,
  expires_at timestamptz,
  revoked_at timestamptz,
  last_used_at timestamptz,
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  constraint integration_api_keys_name_not_blank check (length(trim(name)) > 0)
);

create table if not exists public.learner_external_identities (
  id uuid primary key default gen_random_uuid(),
  learner_id uuid not null references public.learners(id) on delete cascade,
  integration_id uuid not null references public.integration_clients(id) on delete cascade,
  external_user_id text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (integration_id, external_user_id),
  constraint learner_external_metadata_object check (jsonb_typeof(metadata) = 'object')
);

create table if not exists public.embed_sessions (
  id uuid primary key default gen_random_uuid(),
  integration_id uuid not null references public.integration_clients(id) on delete cascade,
  learner_id uuid not null references public.learners(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  release_id uuid references public.course_releases(id) on delete set null,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  external_context_id text,
  allowed_origin text not null,
  token_hash text not null unique,
  permissions text[] not null default array['lesson:read', 'progress:write']::text[],
  expires_at timestamptz not null,
  last_seen_at timestamptz,
  revoked_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint embed_sessions_expiry_future check (expires_at > created_at),
  constraint embed_sessions_metadata_object check (jsonb_typeof(metadata) = 'object')
);

create table if not exists public.idempotency_keys (
  id uuid primary key default gen_random_uuid(),
  integration_id uuid references public.integration_clients(id) on delete cascade,
  scope text not null,
  request_key text not null,
  request_hash text not null,
  response_status integer,
  response_body jsonb,
  locked_until timestamptz,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  unique (integration_id, scope, request_key)
);

create table if not exists public.webhook_events (
  id uuid primary key default gen_random_uuid(),
  integration_id uuid not null references public.integration_clients(id) on delete cascade,
  event_type text not null,
  external_context_id text,
  payload jsonb not null,
  status public.webhook_event_status not null default 'pending',
  attempt_count integer not null default 0,
  available_at timestamptz not null default now(),
  delivered_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint webhook_events_attempts_nonnegative check (attempt_count >= 0),
  constraint webhook_events_payload_object check (jsonb_typeof(payload) = 'object')
);

create table if not exists public.webhook_deliveries (
  id bigint generated always as identity primary key,
  event_id uuid not null references public.webhook_events(id) on delete cascade,
  attempt_number integer not null,
  response_status integer,
  response_body text,
  error_message text,
  duration_ms integer,
  created_at timestamptz not null default now(),
  unique (event_id, attempt_number),
  constraint webhook_deliveries_attempt_positive check (attempt_number > 0),
  constraint webhook_deliveries_duration_nonnegative check (duration_ms is null or duration_ms >= 0)
);

create index if not exists integration_clients_org_status_idx on public.integration_clients(organization_id, status);
create index if not exists integration_access_course_idx on public.integration_course_access(course_id);
create index if not exists api_keys_integration_active_idx on public.integration_api_keys(integration_id, revoked_at, expires_at);
create index if not exists external_identities_learner_idx on public.learner_external_identities(learner_id);
create index if not exists embed_sessions_token_idx on public.embed_sessions(token_hash);
create index if not exists embed_sessions_expiry_idx on public.embed_sessions(expires_at) where revoked_at is null;
create index if not exists idempotency_expiry_idx on public.idempotency_keys(expires_at);
create index if not exists webhook_events_queue_idx on public.webhook_events(status, available_at)
  where status in ('pending', 'failed');
create index if not exists webhook_deliveries_event_idx on public.webhook_deliveries(event_id, created_at desc);

commit;

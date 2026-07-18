
-- ============================================================
-- FILE: 00_extensions_and_types.sql
-- ============================================================

begin;

create extension if not exists pgcrypto;
create extension if not exists citext;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'organization_role') then
    create type public.organization_role as enum ('owner', 'admin', 'editor', 'viewer');
  end if;

  if not exists (select 1 from pg_type where typname = 'course_status') then
    create type public.course_status as enum ('draft', 'published', 'archived');
  end if;

  if not exists (select 1 from pg_type where typname = 'course_visibility') then
    create type public.course_visibility as enum ('private', 'unlisted', 'public');
  end if;

  if not exists (select 1 from pg_type where typname = 'lesson_status') then
    create type public.lesson_status as enum ('draft', 'published', 'archived');
  end if;

  if not exists (select 1 from pg_type where typname = 'enrollment_status') then
    create type public.enrollment_status as enum ('invited', 'active', 'paused', 'completed', 'cancelled');
  end if;

  if not exists (select 1 from pg_type where typname = 'attempt_status') then
    create type public.attempt_status as enum ('not_started', 'in_progress', 'completed', 'failed');
  end if;

  if not exists (select 1 from pg_type where typname = 'integration_status') then
    create type public.integration_status as enum ('active', 'disabled');
  end if;

  if not exists (select 1 from pg_type where typname = 'webhook_event_status') then
    create type public.webhook_event_status as enum ('pending', 'processing', 'delivered', 'failed', 'cancelled');
  end if;
end
$$;

commit;

-- ============================================================
-- FILE: 01_core.sql
-- ============================================================

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

-- ============================================================
-- FILE: 02_course_content.sql
-- ============================================================

begin;

create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  owner_id uuid not null references public.profiles(id) on delete restrict,
  slug text not null,
  title text not null,
  description text,
  language_code text not null default 'en',
  source_level text,
  target_level text,
  duration_weeks smallint,
  lessons_per_week smallint,
  default_lesson_duration smallint not null default 45,
  cover_path text,
  accent_color text not null default '#6D5EFC',
  status public.course_status not null default 'draft',
  visibility public.course_visibility not null default 'private',
  is_sequential boolean not null default true,
  current_release_id uuid,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, slug),
  unique (id, organization_id),
  constraint courses_title_not_blank check (length(trim(title)) > 0),
  constraint courses_slug_format check (slug ~ '^[a-z0-9][a-z0-9-]{1,99}$'),
  constraint courses_language_not_blank check (length(trim(language_code)) > 0),
  constraint courses_duration_weeks_positive check (duration_weeks is null or duration_weeks > 0),
  constraint courses_lessons_per_week_positive check (lessons_per_week is null or lessons_per_week > 0),
  constraint courses_default_duration_positive check (default_lesson_duration > 0),
  constraint courses_accent_color_hex check (accent_color ~ '^#[0-9A-Fa-f]{6}$')
);

create table if not exists public.course_modules (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  title text not null,
  description text,
  position integer not null default 0,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, course_id),
  constraint course_modules_title_not_blank check (length(trim(title)) > 0),
  constraint course_modules_position_nonnegative check (position >= 0)
);

create table if not exists public.lessons (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null,
  module_id uuid not null,
  slug text not null,
  title text not null,
  description text,
  objectives text[] not null default '{}',
  duration_minutes smallint not null default 45,
  passing_score numeric(5,2) not null default 0,
  position integer not null default 0,
  status public.lesson_status not null default 'draft',
  is_preview boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (course_id, slug),
  unique (id, course_id),
  constraint lessons_module_course_fk
    foreign key (module_id, course_id)
    references public.course_modules(id, course_id)
    on delete cascade,
  constraint lessons_title_not_blank check (length(trim(title)) > 0),
  constraint lessons_slug_format check (slug ~ '^[a-z0-9][a-z0-9-]{1,99}$'),
  constraint lessons_duration_positive check (duration_minutes > 0),
  constraint lessons_passing_score_range check (passing_score between 0 and 100),
  constraint lessons_position_nonnegative check (position >= 0)
);

create table if not exists public.lesson_blocks (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null,
  lesson_id uuid not null,
  block_type text not null,
  position integer not null default 0,
  title text,
  public_content jsonb not null default '{}'::jsonb,
  private_content jsonb not null default '{}'::jsonb,
  settings jsonb not null default '{}'::jsonb,
  is_required boolean not null default true,
  points numeric(8,2) not null default 0,
  schema_version smallint not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint lesson_blocks_lesson_course_fk
    foreign key (lesson_id, course_id)
    references public.lessons(id, course_id)
    on delete cascade,
  constraint lesson_blocks_type_check check (
    block_type in (
      'heading', 'rich_text', 'callout', 'image', 'audio', 'video', 'file',
      'vocabulary', 'flashcards', 'grammar', 'example', 'single_choice',
      'multiple_choice', 'text_input', 'fill_blanks', 'matching', 'ordering',
      'sentence_builder', 'translation', 'listening', 'open_answer',
      'divider', 'summary', 'homework'
    )
  ),
  constraint lesson_blocks_position_nonnegative check (position >= 0),
  constraint lesson_blocks_points_nonnegative check (points >= 0),
  constraint lesson_blocks_schema_version_positive check (schema_version > 0),
  constraint lesson_blocks_public_object check (jsonb_typeof(public_content) = 'object'),
  constraint lesson_blocks_private_object check (jsonb_typeof(private_content) = 'object'),
  constraint lesson_blocks_settings_object check (jsonb_typeof(settings) = 'object')
);

create table if not exists public.course_releases (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  version integer not null,
  snapshot jsonb not null,
  module_count integer not null default 0,
  lesson_count integer not null default 0,
  changelog text,
  published_by uuid not null references public.profiles(id) on delete restrict,
  published_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (course_id, version),
  constraint course_releases_version_positive check (version > 0),
  constraint course_releases_counts_nonnegative check (module_count >= 0 and lesson_count >= 0),
  constraint course_releases_snapshot_object check (jsonb_typeof(snapshot) = 'object')
);

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'courses_current_release_fk'
  ) then
    alter table public.courses
      add constraint courses_current_release_fk
      foreign key (current_release_id)
      references public.course_releases(id)
      on delete set null;
  end if;
end
$$;

create index if not exists courses_org_status_idx
  on public.courses(organization_id, status, updated_at desc);
create index if not exists course_modules_course_position_idx
  on public.course_modules(course_id, position);
create index if not exists lessons_course_module_position_idx
  on public.lessons(course_id, module_id, position);
create index if not exists lesson_blocks_lesson_position_idx
  on public.lesson_blocks(lesson_id, position);
create index if not exists course_releases_course_published_idx
  on public.course_releases(course_id, published_at desc);

commit;

-- ============================================================
-- FILE: 03_learning.sql
-- ============================================================

begin;

create table if not exists public.learners (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users(id) on delete set null,
  display_name text,
  email citext,
  avatar_url text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint learners_metadata_object check (jsonb_typeof(metadata) = 'object')
);

create table if not exists public.course_enrollments (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  release_id uuid references public.course_releases(id) on delete set null,
  learner_id uuid not null references public.learners(id) on delete cascade,
  status public.enrollment_status not null default 'active',
  source text not null default 'manual',
  progress_percent numeric(5,2) not null default 0,
  completed_lessons integer not null default 0,
  total_lessons integer not null default 0,
  enrolled_by uuid references public.profiles(id) on delete set null,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (course_id, learner_id),
  constraint course_enrollments_progress_range check (progress_percent between 0 and 100),
  constraint course_enrollments_counts_nonnegative check (completed_lessons >= 0 and total_lessons >= 0)
);

create table if not exists public.lesson_attempts (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid not null references public.course_enrollments(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  release_id uuid references public.course_releases(id) on delete set null,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  learner_id uuid not null references public.learners(id) on delete cascade,
  external_context_id text,
  attempt_number integer not null default 1,
  status public.attempt_status not null default 'not_started',
  progress_percent numeric(5,2) not null default 0,
  score numeric(10,2) not null default 0,
  max_score numeric(10,2) not null default 0,
  started_at timestamptz,
  last_activity_at timestamptz,
  completed_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (lesson_id, learner_id, attempt_number),
  constraint lesson_attempts_number_positive check (attempt_number > 0),
  constraint lesson_attempts_progress_range check (progress_percent between 0 and 100),
  constraint lesson_attempts_scores_nonnegative check (score >= 0 and max_score >= 0),
  constraint lesson_attempts_metadata_object check (jsonb_typeof(metadata) = 'object')
);

create table if not exists public.lesson_block_progress (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.lesson_attempts(id) on delete cascade,
  block_id uuid not null references public.lesson_blocks(id) on delete cascade,
  learner_id uuid not null references public.learners(id) on delete cascade,
  status public.attempt_status not null default 'not_started',
  progress_percent numeric(5,2) not null default 0,
  response jsonb not null default '{}'::jsonb,
  is_correct boolean,
  score numeric(10,2) not null default 0,
  max_score numeric(10,2) not null default 0,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (attempt_id, block_id),
  constraint lesson_block_progress_range check (progress_percent between 0 and 100),
  constraint lesson_block_progress_scores_nonnegative check (score >= 0 and max_score >= 0),
  constraint lesson_block_progress_response_object check (jsonb_typeof(response) = 'object')
);

create table if not exists public.learner_notes (
  id uuid primary key default gen_random_uuid(),
  learner_id uuid not null references public.learners(id) on delete cascade,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  block_id uuid references public.lesson_blocks(id) on delete set null,
  content text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint learner_notes_content_not_blank check (length(trim(content)) > 0)
);

create index if not exists learners_user_idx on public.learners(user_id);
create index if not exists enrollments_learner_status_idx on public.course_enrollments(learner_id, status);
create index if not exists enrollments_course_status_idx on public.course_enrollments(course_id, status);
create index if not exists lesson_attempts_learner_activity_idx on public.lesson_attempts(learner_id, last_activity_at desc);
create index if not exists lesson_attempts_enrollment_lesson_idx on public.lesson_attempts(enrollment_id, lesson_id);
create index if not exists block_progress_attempt_idx on public.lesson_block_progress(attempt_id);
create index if not exists learner_notes_lesson_idx on public.learner_notes(learner_id, lesson_id);

commit;

-- ============================================================
-- FILE: 04_integrations.sql
-- ============================================================

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

-- ============================================================
-- FILE: 05_functions_and_triggers.sql
-- ============================================================

begin;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.is_org_member(p_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organization_members om
    where om.organization_id = p_organization_id
      and om.user_id = auth.uid()
  );
$$;

create or replace function public.has_org_role(
  p_organization_id uuid,
  p_roles public.organization_role[]
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organization_members om
    where om.organization_id = p_organization_id
      and om.user_id = auth.uid()
      and om.role = any(p_roles)
  );
$$;

create or replace function public.shares_organization(p_other_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organization_members mine
    join public.organization_members theirs
      on theirs.organization_id = mine.organization_id
    where mine.user_id = auth.uid()
      and theirs.user_id = p_other_user_id
  );
$$;

create or replace function public.create_organization(
  p_name text,
  p_slug text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
begin
  if auth.uid() is null then
    raise exception 'UNAUTHENTICATED';
  end if;

  if length(trim(p_name)) = 0 then
    raise exception 'INVALID_NAME';
  end if;

  if p_slug !~ '^[a-z0-9][a-z0-9-]{2,63}$' then
    raise exception 'INVALID_SLUG';
  end if;

  insert into public.organizations (owner_id, name, slug)
  values (auth.uid(), trim(p_name), p_slug)
  returning id into v_org_id;

  insert into public.organization_members (organization_id, user_id, role)
  values (v_org_id, auth.uid(), 'owner');

  return v_org_id;
end;
$$;

create or replace function public.can_manage_course(p_course_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.courses c
    join public.organization_members om
      on om.organization_id = c.organization_id
    where c.id = p_course_id
      and om.user_id = auth.uid()
      and om.role in ('owner', 'admin', 'editor')
  );
$$;

create or replace function public.can_view_course_as_author(p_course_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.courses c
    where c.id = p_course_id
      and public.is_org_member(c.organization_id)
  );
$$;

create or replace function public.storage_object_org_id(p_name text)
returns uuid
language plpgsql
immutable
as $$
declare
  v_part text;
begin
  v_part := split_part(p_name, '/', 1);

  if v_part ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' then
    return v_part::uuid;
  end if;

  return null;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid := gen_random_uuid();
  v_display_name text;
  v_slug text;
begin
  v_display_name := coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
    split_part(coalesce(new.email, 'user'), '@', 1)
  );

  v_slug := 'workspace-' || left(replace(new.id::text, '-', ''), 12);

  insert into public.profiles (id, email, display_name)
  values (new.id, new.email, v_display_name)
  on conflict (id) do nothing;

  insert into public.learners (user_id, display_name, email)
  values (new.id, v_display_name, new.email)
  on conflict (user_id) do nothing;

  insert into public.organizations (id, owner_id, name, slug)
  values (v_org_id, new.id, coalesce(v_display_name, 'My') || ' Workspace', v_slug);

  insert into public.organization_members (organization_id, user_id, role)
  values (v_org_id, new.id, 'owner');

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create or replace function public.publish_course(
  p_course_id uuid,
  p_changelog text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_release_id uuid;
  v_version integer;
  v_snapshot jsonb;
  v_module_count integer;
  v_lesson_count integer;
  v_org_id uuid;
begin
  if not public.can_manage_course(p_course_id) then
    raise exception 'FORBIDDEN';
  end if;

  select organization_id into v_org_id
  from public.courses
  where id = p_course_id;

  select count(*) into v_module_count
  from public.course_modules
  where course_id = p_course_id;

  select count(*) into v_lesson_count
  from public.lessons
  where course_id = p_course_id
    and status <> 'archived';

  if v_module_count = 0 then
    raise exception 'COURSE_HAS_NO_MODULES';
  end if;

  if v_lesson_count = 0 then
    raise exception 'COURSE_HAS_NO_LESSONS';
  end if;

  select coalesce(max(cr.version), 0) + 1
  into v_version
  from public.course_releases cr
  where cr.course_id = p_course_id;

  select jsonb_build_object(
    'schemaVersion', 1,
    'course', jsonb_build_object(
      'id', c.id,
      'slug', c.slug,
      'title', c.title,
      'description', c.description,
      'languageCode', c.language_code,
      'sourceLevel', c.source_level,
      'targetLevel', c.target_level,
      'durationWeeks', c.duration_weeks,
      'lessonsPerWeek', c.lessons_per_week,
      'defaultLessonDuration', c.default_lesson_duration,
      'coverPath', c.cover_path,
      'accentColor', c.accent_color,
      'isSequential', c.is_sequential
    ),
    'modules', coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'id', m.id,
            'title', m.title,
            'description', m.description,
            'position', m.position,
            'lessons', coalesce(
              (
                select jsonb_agg(
                  jsonb_build_object(
                    'id', l.id,
                    'slug', l.slug,
                    'title', l.title,
                    'description', l.description,
                    'objectives', l.objectives,
                    'durationMinutes', l.duration_minutes,
                    'passingScore', l.passing_score,
                    'position', l.position,
                    'isPreview', l.is_preview,
                    'blocks', coalesce(
                      (
                        select jsonb_agg(
                          jsonb_build_object(
                            'id', b.id,
                            'blockType', b.block_type,
                            'position', b.position,
                            'title', b.title,
                            'publicContent', b.public_content,
                            'privateContent', b.private_content,
                            'settings', b.settings,
                            'isRequired', b.is_required,
                            'points', b.points,
                            'schemaVersion', b.schema_version
                          ) order by b.position, b.created_at
                        )
                        from public.lesson_blocks b
                        where b.lesson_id = l.id
                      ),
                      '[]'::jsonb
                    )
                  ) order by l.position, l.created_at
                )
                from public.lessons l
                where l.module_id = m.id
                  and l.status <> 'archived'
              ),
              '[]'::jsonb
            )
          ) order by m.position, m.created_at
        )
        from public.course_modules m
        where m.course_id = c.id
      ),
      '[]'::jsonb
    )
  )
  into v_snapshot
  from public.courses c
  where c.id = p_course_id;

  if v_snapshot is null then
    raise exception 'COURSE_NOT_FOUND';
  end if;

  insert into public.course_releases (
    course_id, version, snapshot, module_count, lesson_count, changelog, published_by
  )
  values (
    p_course_id, v_version, v_snapshot, v_module_count, v_lesson_count, p_changelog, auth.uid()
  )
  returning id into v_release_id;

  update public.courses
  set current_release_id = v_release_id,
      status = 'published',
      published_at = now(),
      updated_at = now()
  where id = p_course_id;

  insert into public.audit_logs (
    organization_id, actor_user_id, action, entity_type, entity_id, metadata
  ) values (
    v_org_id,
    auth.uid(),
    'course.published',
    'course',
    p_course_id::text,
    jsonb_build_object('releaseId', v_release_id, 'version', v_version)
  );

  return v_release_id;
end;
$$;

create or replace function public.create_integration_api_key(
  p_integration_id uuid,
  p_name text,
  p_expires_at timestamptz default null
)
returns table (api_key_id uuid, api_key text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
  v_raw_key text;
  v_key_hash text;
  v_key_prefix text;
  v_id uuid;
begin
  select organization_id into v_org_id
  from public.integration_clients
  where id = p_integration_id;

  if v_org_id is null then
    raise exception 'INTEGRATION_NOT_FOUND';
  end if;

  if not public.has_org_role(
    v_org_id,
    array['owner', 'admin']::public.organization_role[]
  ) then
    raise exception 'FORBIDDEN';
  end if;

  if p_expires_at is not null and p_expires_at <= now() then
    raise exception 'INVALID_EXPIRY';
  end if;

  v_raw_key := 'cp_live_' || encode(gen_random_bytes(32), 'hex');
  v_key_hash := encode(digest(v_raw_key, 'sha256'), 'hex');
  v_key_prefix := left(v_raw_key, 16);

  insert into public.integration_api_keys (
    integration_id, name, key_prefix, key_hash, expires_at, created_by
  ) values (
    p_integration_id, p_name, v_key_prefix, v_key_hash, p_expires_at, auth.uid()
  ) returning id into v_id;

  insert into public.audit_logs (
    organization_id, actor_user_id, action, entity_type, entity_id,
    metadata
  ) values (
    v_org_id,
    auth.uid(),
    'integration.api_key.created',
    'integration_api_key',
    v_id::text,
    jsonb_build_object('integrationId', p_integration_id, 'prefix', v_key_prefix)
  );

  api_key_id := v_id;
  api_key := v_raw_key;
  return next;
end;
$$;

create or replace function public.revoke_integration_api_key(p_api_key_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
begin
  select ic.organization_id into v_org_id
  from public.integration_api_keys k
  join public.integration_clients ic on ic.id = k.integration_id
  where k.id = p_api_key_id;

  if v_org_id is null then
    raise exception 'API_KEY_NOT_FOUND';
  end if;

  if not public.has_org_role(
    v_org_id,
    array['owner', 'admin']::public.organization_role[]
  ) then
    raise exception 'FORBIDDEN';
  end if;

  update public.integration_api_keys
  set revoked_at = coalesce(revoked_at, now())
  where id = p_api_key_id;
end;
$$;

create or replace function public.list_integration_api_keys(p_integration_id uuid)
returns table (
  id uuid,
  name text,
  key_prefix text,
  expires_at timestamptz,
  revoked_at timestamptz,
  last_used_at timestamptz,
  created_by uuid,
  created_at timestamptz
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
begin
  select organization_id into v_org_id
  from public.integration_clients
  where integration_clients.id = p_integration_id;

  if v_org_id is null then
    raise exception 'INTEGRATION_NOT_FOUND';
  end if;

  if not public.has_org_role(
    v_org_id,
    array['owner', 'admin']::public.organization_role[]
  ) then
    raise exception 'FORBIDDEN';
  end if;

  return query
  select k.id, k.name, k.key_prefix, k.expires_at, k.revoked_at,
         k.last_used_at, k.created_by, k.created_at
  from public.integration_api_keys k
  where k.integration_id = p_integration_id
  order by k.created_at desc;
end;
$$;

create or replace function public.reorder_course_modules(
  p_course_id uuid,
  p_items jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_item jsonb;
begin
  if not public.can_manage_course(p_course_id) then
    raise exception 'FORBIDDEN';
  end if;

  if jsonb_typeof(p_items) <> 'array' then
    raise exception 'INVALID_ITEMS';
  end if;

  for v_item in select value from jsonb_array_elements(p_items)
  loop
    update public.course_modules
    set position = (v_item ->> 'position')::integer,
        updated_at = now()
    where id = (v_item ->> 'id')::uuid
      and course_id = p_course_id;

    if not found then
      raise exception 'MODULE_NOT_FOUND_OR_WRONG_COURSE';
    end if;
  end loop;
end;
$$;

create or replace function public.reorder_lessons(
  p_course_id uuid,
  p_items jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_item jsonb;
begin
  if not public.can_manage_course(p_course_id) then
    raise exception 'FORBIDDEN';
  end if;

  if jsonb_typeof(p_items) <> 'array' then
    raise exception 'INVALID_ITEMS';
  end if;

  for v_item in select value from jsonb_array_elements(p_items)
  loop
    update public.lessons
    set module_id = (v_item ->> 'moduleId')::uuid,
        position = (v_item ->> 'position')::integer,
        updated_at = now()
    where id = (v_item ->> 'id')::uuid
      and course_id = p_course_id;

    if not found then
      raise exception 'LESSON_NOT_FOUND_OR_WRONG_COURSE';
    end if;
  end loop;
end;
$$;

create or replace function public.reorder_lesson_blocks(
  p_lesson_id uuid,
  p_items jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_course_id uuid;
  v_item jsonb;
begin
  select course_id into v_course_id
  from public.lessons
  where id = p_lesson_id;

  if v_course_id is null or not public.can_manage_course(v_course_id) then
    raise exception 'FORBIDDEN';
  end if;

  if jsonb_typeof(p_items) <> 'array' then
    raise exception 'INVALID_ITEMS';
  end if;

  for v_item in select value from jsonb_array_elements(p_items)
  loop
    update public.lesson_blocks
    set position = (v_item ->> 'position')::integer,
        updated_at = now()
    where id = (v_item ->> 'id')::uuid
      and lesson_id = p_lesson_id;

    if not found then
      raise exception 'BLOCK_NOT_FOUND_OR_WRONG_LESSON';
    end if;
  end loop;
end;
$$;

create or replace function public.initialize_enrollment_totals()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_total integer;
begin
  if new.release_id is not null then
    select lesson_count into v_total
    from public.course_releases
    where id = new.release_id
      and course_id = new.course_id;
  else
    select count(*) into v_total
    from public.lessons
    where course_id = new.course_id
      and status <> 'archived';
  end if;

  new.total_lessons := coalesce(v_total, 0);
  return new;
end;
$$;

drop trigger if exists initialize_enrollment_totals on public.course_enrollments;
create trigger initialize_enrollment_totals
  before insert or update of release_id, course_id
  on public.course_enrollments
  for each row execute procedure public.initialize_enrollment_totals();

create or replace function public.recalculate_enrollment_progress()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_enrollment_id uuid;
  v_completed integer;
  v_total integer;
  v_progress numeric(5,2);
begin
  if tg_op = 'DELETE' then
    v_enrollment_id := old.enrollment_id;
  else
    v_enrollment_id := new.enrollment_id;
  end if;

  select
    count(distinct la.lesson_id) filter (where la.status = 'completed'),
    ce.total_lessons
  into v_completed, v_total
  from public.course_enrollments ce
  left join public.lesson_attempts la on la.enrollment_id = ce.id
  where ce.id = v_enrollment_id
  group by ce.total_lessons;

  if coalesce(v_total, 0) > 0 then
    v_progress := round((coalesce(v_completed, 0)::numeric / v_total::numeric) * 100, 2);
  else
    v_progress := 0;
  end if;

  update public.course_enrollments
  set completed_lessons = coalesce(v_completed, 0),
      progress_percent = coalesce(v_progress, 0),
      status = case
        when coalesce(v_total, 0) > 0 and coalesce(v_completed, 0) >= v_total
          then 'completed'::public.enrollment_status
        else status
      end,
      completed_at = case
        when coalesce(v_total, 0) > 0 and coalesce(v_completed, 0) >= v_total
          then coalesce(completed_at, now())
        else completed_at
      end,
      updated_at = now()
  where id = v_enrollment_id;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

drop trigger if exists lesson_attempts_recalculate_enrollment_insert_delete on public.lesson_attempts;
create trigger lesson_attempts_recalculate_enrollment_insert_delete
  after insert or delete
  on public.lesson_attempts
  for each row execute procedure public.recalculate_enrollment_progress();

drop trigger if exists lesson_attempts_recalculate_enrollment_update on public.lesson_attempts;
create trigger lesson_attempts_recalculate_enrollment_update
  after update of status, progress_percent
  on public.lesson_attempts
  for each row execute procedure public.recalculate_enrollment_progress();

do $$
declare
  t text;
begin
  foreach t in array array[
    'profiles', 'organizations', 'organization_members', 'courses',
    'course_modules', 'lessons', 'lesson_blocks', 'learners',
    'course_enrollments', 'lesson_attempts', 'lesson_block_progress',
    'learner_notes', 'integration_clients', 'learner_external_identities',
    'webhook_events'
  ]
  loop
    execute format('drop trigger if exists set_updated_at on public.%I', t);
    execute format(
      'create trigger set_updated_at before update on public.%I for each row execute procedure public.set_updated_at()',
      t
    );
  end loop;
end
$$;


create or replace function public.protect_organization_owner_id()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.owner_id <> old.owner_id then
    raise exception 'OWNER_TRANSFER_REQUIRES_DEDICATED_WORKFLOW';
  end if;
  return new;
end;
$$;

drop trigger if exists protect_organization_owner_id on public.organizations;
create trigger protect_organization_owner_id
  before update of owner_id
  on public.organizations
  for each row execute procedure public.protect_organization_owner_id();

create or replace function public.protect_organization_owner_membership()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner_id uuid;
begin
  if tg_op = 'DELETE' then
    select owner_id into v_owner_id
    from public.organizations
    where id = old.organization_id;
  else
    select owner_id into v_owner_id
    from public.organizations
    where id = new.organization_id;
  end if;

  if tg_op = 'DELETE' and old.user_id = v_owner_id then
    raise exception 'CANNOT_DELETE_ORGANIZATION_OWNER';
  end if;

  if tg_op in ('INSERT', 'UPDATE') then
    if new.user_id = v_owner_id and new.role <> 'owner' then
      raise exception 'ORGANIZATION_OWNER_MUST_KEEP_OWNER_ROLE';
    end if;

    if new.role = 'owner' and new.user_id <> v_owner_id then
      raise exception 'ONLY_ORGANIZATION_OWNER_CAN_HAVE_OWNER_ROLE';
    end if;
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

drop trigger if exists protect_organization_owner_membership on public.organization_members;
create trigger protect_organization_owner_membership
  before insert or update or delete
  on public.organization_members
  for each row execute procedure public.protect_organization_owner_membership();

revoke all on function public.create_organization(text, text) from public;
revoke all on function public.publish_course(uuid, text) from public;
revoke all on function public.create_integration_api_key(uuid, text, timestamptz) from public;
revoke all on function public.revoke_integration_api_key(uuid) from public;
revoke all on function public.list_integration_api_keys(uuid) from public;
revoke all on function public.reorder_course_modules(uuid, jsonb) from public;
revoke all on function public.reorder_lessons(uuid, jsonb) from public;
revoke all on function public.reorder_lesson_blocks(uuid, jsonb) from public;

grant execute on function public.create_organization(text, text) to authenticated;
grant execute on function public.publish_course(uuid, text) to authenticated;
grant execute on function public.create_integration_api_key(uuid, text, timestamptz) to authenticated;
grant execute on function public.revoke_integration_api_key(uuid) to authenticated;
grant execute on function public.list_integration_api_keys(uuid) to authenticated;
grant execute on function public.reorder_course_modules(uuid, jsonb) to authenticated;
grant execute on function public.reorder_lessons(uuid, jsonb) to authenticated;
grant execute on function public.reorder_lesson_blocks(uuid, jsonb) to authenticated;

commit;

-- ============================================================
-- FILE: 06_rls.sql
-- ============================================================

begin;

alter table public.profiles enable row level security;
alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.audit_logs enable row level security;
alter table public.courses enable row level security;
alter table public.course_modules enable row level security;
alter table public.lessons enable row level security;
alter table public.lesson_blocks enable row level security;
alter table public.course_releases enable row level security;
alter table public.learners enable row level security;
alter table public.course_enrollments enable row level security;
alter table public.lesson_attempts enable row level security;
alter table public.lesson_block_progress enable row level security;
alter table public.learner_notes enable row level security;
alter table public.integration_clients enable row level security;
alter table public.integration_course_access enable row level security;
alter table public.integration_api_keys enable row level security;
alter table public.learner_external_identities enable row level security;
alter table public.embed_sessions enable row level security;
alter table public.idempotency_keys enable row level security;
alter table public.webhook_events enable row level security;
alter table public.webhook_deliveries enable row level security;

-- Profiles

drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own
on public.profiles for select to authenticated
using (id = auth.uid() or public.shares_organization(id));

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own
on public.profiles for update to authenticated
using (id = auth.uid())
with check (id = auth.uid());

-- Organizations

drop policy if exists organizations_select_member on public.organizations;
create policy organizations_select_member
on public.organizations for select to authenticated
using (public.is_org_member(id));

-- Organization creation is performed through public.create_organization().

drop policy if exists organizations_update_admin on public.organizations;
create policy organizations_update_admin
on public.organizations for update to authenticated
using (public.has_org_role(id, array['owner', 'admin']::public.organization_role[]))
with check (public.has_org_role(id, array['owner', 'admin']::public.organization_role[]));

drop policy if exists organizations_delete_owner on public.organizations;
create policy organizations_delete_owner
on public.organizations for delete to authenticated
using (public.has_org_role(id, array['owner']::public.organization_role[]));

-- Organization members

drop policy if exists organization_members_select_member on public.organization_members;
create policy organization_members_select_member
on public.organization_members for select to authenticated
using (public.is_org_member(organization_id));

drop policy if exists organization_members_insert_admin on public.organization_members;
create policy organization_members_insert_admin
on public.organization_members for insert to authenticated
with check (
  public.has_org_role(
    organization_id,
    array['owner', 'admin']::public.organization_role[]
  )
);

drop policy if exists organization_members_update_admin on public.organization_members;
create policy organization_members_update_admin
on public.organization_members for update to authenticated
using (
  public.has_org_role(
    organization_id,
    array['owner', 'admin']::public.organization_role[]
  )
)
with check (
  public.has_org_role(
    organization_id,
    array['owner', 'admin']::public.organization_role[]
  )
);

drop policy if exists organization_members_delete_admin on public.organization_members;
create policy organization_members_delete_admin
on public.organization_members for delete to authenticated
using (
  public.has_org_role(
    organization_id,
    array['owner', 'admin']::public.organization_role[]
  )
);

-- Audit logs are read-only from the app.

drop policy if exists audit_logs_select_admin on public.audit_logs;
create policy audit_logs_select_admin
on public.audit_logs for select to authenticated
using (
  organization_id is not null
  and public.has_org_role(
    organization_id,
    array['owner', 'admin']::public.organization_role[]
  )
);

-- Course authoring tables. Learner delivery uses Edge Functions, not direct Data API.

drop policy if exists courses_select_member on public.courses;
create policy courses_select_member
on public.courses for select to authenticated
using (public.is_org_member(organization_id));

drop policy if exists courses_insert_editor on public.courses;
create policy courses_insert_editor
on public.courses for insert to authenticated
with check (
  owner_id = auth.uid()
  and public.has_org_role(
    organization_id,
    array['owner', 'admin', 'editor']::public.organization_role[]
  )
);

drop policy if exists courses_update_editor on public.courses;
create policy courses_update_editor
on public.courses for update to authenticated
using (public.can_manage_course(id))
with check (
  public.has_org_role(
    organization_id,
    array['owner', 'admin', 'editor']::public.organization_role[]
  )
);

drop policy if exists courses_delete_editor on public.courses;
create policy courses_delete_editor
on public.courses for delete to authenticated
using (public.can_manage_course(id));

drop policy if exists modules_select_author on public.course_modules;
create policy modules_select_author
on public.course_modules for select to authenticated
using (public.can_view_course_as_author(course_id));

drop policy if exists modules_insert_editor on public.course_modules;
create policy modules_insert_editor
on public.course_modules for insert to authenticated
with check (public.can_manage_course(course_id));

drop policy if exists modules_update_editor on public.course_modules;
create policy modules_update_editor
on public.course_modules for update to authenticated
using (public.can_manage_course(course_id))
with check (public.can_manage_course(course_id));

drop policy if exists modules_delete_editor on public.course_modules;
create policy modules_delete_editor
on public.course_modules for delete to authenticated
using (public.can_manage_course(course_id));

drop policy if exists lessons_select_author on public.lessons;
create policy lessons_select_author
on public.lessons for select to authenticated
using (public.can_view_course_as_author(course_id));

drop policy if exists lessons_insert_editor on public.lessons;
create policy lessons_insert_editor
on public.lessons for insert to authenticated
with check (public.can_manage_course(course_id));

drop policy if exists lessons_update_editor on public.lessons;
create policy lessons_update_editor
on public.lessons for update to authenticated
using (public.can_manage_course(course_id))
with check (public.can_manage_course(course_id));

drop policy if exists lessons_delete_editor on public.lessons;
create policy lessons_delete_editor
on public.lessons for delete to authenticated
using (public.can_manage_course(course_id));

drop policy if exists lesson_blocks_select_author on public.lesson_blocks;
create policy lesson_blocks_select_author
on public.lesson_blocks for select to authenticated
using (public.can_view_course_as_author(course_id));

drop policy if exists lesson_blocks_insert_editor on public.lesson_blocks;
create policy lesson_blocks_insert_editor
on public.lesson_blocks for insert to authenticated
with check (public.can_manage_course(course_id));

drop policy if exists lesson_blocks_update_editor on public.lesson_blocks;
create policy lesson_blocks_update_editor
on public.lesson_blocks for update to authenticated
using (public.can_manage_course(course_id))
with check (public.can_manage_course(course_id));

drop policy if exists lesson_blocks_delete_editor on public.lesson_blocks;
create policy lesson_blocks_delete_editor
on public.lesson_blocks for delete to authenticated
using (public.can_manage_course(course_id));

drop policy if exists releases_select_author on public.course_releases;
create policy releases_select_author
on public.course_releases for select to authenticated
using (public.can_view_course_as_author(course_id));

-- Learners

drop policy if exists learners_select_own_or_manager on public.learners;
create policy learners_select_own_or_manager
on public.learners for select to authenticated
using (
  user_id = auth.uid()
  or exists (
    select 1
    from public.course_enrollments ce
    where ce.learner_id = learners.id
      and public.can_view_course_as_author(ce.course_id)
  )
);

drop policy if exists learners_update_own on public.learners;
create policy learners_update_own
on public.learners for update to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists enrollments_select_own_or_manager on public.course_enrollments;
create policy enrollments_select_own_or_manager
on public.course_enrollments for select to authenticated
using (
  exists (
    select 1 from public.learners l
    where l.id = learner_id and l.user_id = auth.uid()
  )
  or public.can_view_course_as_author(course_id)
);

drop policy if exists enrollments_insert_manager on public.course_enrollments;
create policy enrollments_insert_manager
on public.course_enrollments for insert to authenticated
with check (public.can_manage_course(course_id));

drop policy if exists enrollments_update_manager on public.course_enrollments;
create policy enrollments_update_manager
on public.course_enrollments for update to authenticated
using (public.can_manage_course(course_id))
with check (public.can_manage_course(course_id));

drop policy if exists enrollments_delete_manager on public.course_enrollments;
create policy enrollments_delete_manager
on public.course_enrollments for delete to authenticated
using (public.can_manage_course(course_id));

-- Attempts and block progress are written only by trusted Edge Functions.

drop policy if exists attempts_select_own_or_manager on public.lesson_attempts;
create policy attempts_select_own_or_manager
on public.lesson_attempts for select to authenticated
using (
  exists (
    select 1 from public.learners l
    where l.id = learner_id and l.user_id = auth.uid()
  )
  or public.can_view_course_as_author(course_id)
);

drop policy if exists block_progress_select_own_or_manager on public.lesson_block_progress;
create policy block_progress_select_own_or_manager
on public.lesson_block_progress for select to authenticated
using (
  exists (
    select 1 from public.learners l
    where l.id = learner_id and l.user_id = auth.uid()
  )
  or exists (
    select 1 from public.lesson_attempts la
    where la.id = attempt_id
      and public.can_view_course_as_author(la.course_id)
  )
);

-- Notes can be managed directly only by the owning internal learner.

drop policy if exists learner_notes_select_own on public.learner_notes;
create policy learner_notes_select_own
on public.learner_notes for select to authenticated
using (
  exists (
    select 1 from public.learners l
    where l.id = learner_id and l.user_id = auth.uid()
  )
);

drop policy if exists learner_notes_insert_own on public.learner_notes;
create policy learner_notes_insert_own
on public.learner_notes for insert to authenticated
with check (
  exists (
    select 1 from public.learners l
    where l.id = learner_id and l.user_id = auth.uid()
  )
);

drop policy if exists learner_notes_update_own on public.learner_notes;
create policy learner_notes_update_own
on public.learner_notes for update to authenticated
using (
  exists (
    select 1 from public.learners l
    where l.id = learner_id and l.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.learners l
    where l.id = learner_id and l.user_id = auth.uid()
  )
);

drop policy if exists learner_notes_delete_own on public.learner_notes;
create policy learner_notes_delete_own
on public.learner_notes for delete to authenticated
using (
  exists (
    select 1 from public.learners l
    where l.id = learner_id and l.user_id = auth.uid()
  )
);

-- Integrations

drop policy if exists integrations_select_admin on public.integration_clients;
create policy integrations_select_admin
on public.integration_clients for select to authenticated
using (
  public.has_org_role(
    organization_id,
    array['owner', 'admin']::public.organization_role[]
  )
);

drop policy if exists integrations_insert_admin on public.integration_clients;
create policy integrations_insert_admin
on public.integration_clients for insert to authenticated
with check (
  created_by = auth.uid()
  and public.has_org_role(
    organization_id,
    array['owner', 'admin']::public.organization_role[]
  )
);

drop policy if exists integrations_update_admin on public.integration_clients;
create policy integrations_update_admin
on public.integration_clients for update to authenticated
using (
  public.has_org_role(
    organization_id,
    array['owner', 'admin']::public.organization_role[]
  )
)
with check (
  public.has_org_role(
    organization_id,
    array['owner', 'admin']::public.organization_role[]
  )
);

drop policy if exists integrations_delete_owner on public.integration_clients;
create policy integrations_delete_owner
on public.integration_clients for delete to authenticated
using (
  public.has_org_role(
    organization_id,
    array['owner']::public.organization_role[]
  )
);

drop policy if exists integration_access_select_admin on public.integration_course_access;
create policy integration_access_select_admin
on public.integration_course_access for select to authenticated
using (
  exists (
    select 1 from public.integration_clients ic
    where ic.id = integration_id
      and public.has_org_role(
        ic.organization_id,
        array['owner', 'admin']::public.organization_role[]
      )
  )
);

drop policy if exists integration_access_manage_admin on public.integration_course_access;
create policy integration_access_manage_admin
on public.integration_course_access for all to authenticated
using (
  exists (
    select 1 from public.integration_clients ic
    where ic.id = integration_id
      and public.has_org_role(
        ic.organization_id,
        array['owner', 'admin']::public.organization_role[]
      )
  )
)
with check (
  exists (
    select 1 from public.integration_clients ic
    where ic.id = integration_id
      and public.has_org_role(
        ic.organization_id,
        array['owner', 'admin']::public.organization_role[]
      )
  )
);

-- API key hashes, external identities, embed sessions and idempotency keys have
-- no authenticated policies. They are accessed through security-definer RPCs
-- or trusted Edge Functions only.

-- Webhook monitoring is read-only for organization admins.

drop policy if exists webhook_events_select_admin on public.webhook_events;
create policy webhook_events_select_admin
on public.webhook_events for select to authenticated
using (
  exists (
    select 1 from public.integration_clients ic
    where ic.id = integration_id
      and public.has_org_role(
        ic.organization_id,
        array['owner', 'admin']::public.organization_role[]
      )
  )
);

drop policy if exists webhook_deliveries_select_admin on public.webhook_deliveries;
create policy webhook_deliveries_select_admin
on public.webhook_deliveries for select to authenticated
using (
  exists (
    select 1
    from public.webhook_events we
    join public.integration_clients ic on ic.id = we.integration_id
    where we.id = event_id
      and public.has_org_role(
        ic.organization_id,
        array['owner', 'admin']::public.organization_role[]
      )
  )
);

commit;

-- ============================================================
-- FILE: 07_storage.sql
-- ============================================================

begin;

insert into storage.buckets (
  id, name, public, file_size_limit, allowed_mime_types
)
values
(
  'course-covers',
  'course-covers',
  false,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
),
(
  'lesson-assets',
  'lesson-assets',
  false,
  209715200,
  array[
    'image/jpeg', 'image/png', 'image/webp', 'image/avif',
    'audio/mpeg', 'audio/mp4', 'audio/ogg', 'audio/wav',
    'video/mp4', 'video/webm', 'application/pdf'
  ]
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists course_covers_select_member on storage.objects;
create policy course_covers_select_member
on storage.objects for select to authenticated
using (
  bucket_id = 'course-covers'
  and public.is_org_member(public.storage_object_org_id(name))
);

drop policy if exists course_covers_insert_editor on storage.objects;
create policy course_covers_insert_editor
on storage.objects for insert to authenticated
with check (
  bucket_id = 'course-covers'
  and public.has_org_role(
    public.storage_object_org_id(name),
    array['owner', 'admin', 'editor']::public.organization_role[]
  )
);

drop policy if exists course_covers_update_editor on storage.objects;
create policy course_covers_update_editor
on storage.objects for update to authenticated
using (
  bucket_id = 'course-covers'
  and public.has_org_role(
    public.storage_object_org_id(name),
    array['owner', 'admin', 'editor']::public.organization_role[]
  )
)
with check (
  bucket_id = 'course-covers'
  and public.has_org_role(
    public.storage_object_org_id(name),
    array['owner', 'admin', 'editor']::public.organization_role[]
  )
);

drop policy if exists course_covers_delete_editor on storage.objects;
create policy course_covers_delete_editor
on storage.objects for delete to authenticated
using (
  bucket_id = 'course-covers'
  and public.has_org_role(
    public.storage_object_org_id(name),
    array['owner', 'admin', 'editor']::public.organization_role[]
  )
);

drop policy if exists lesson_assets_select_member on storage.objects;
create policy lesson_assets_select_member
on storage.objects for select to authenticated
using (
  bucket_id = 'lesson-assets'
  and public.is_org_member(public.storage_object_org_id(name))
);

drop policy if exists lesson_assets_insert_editor on storage.objects;
create policy lesson_assets_insert_editor
on storage.objects for insert to authenticated
with check (
  bucket_id = 'lesson-assets'
  and public.has_org_role(
    public.storage_object_org_id(name),
    array['owner', 'admin', 'editor']::public.organization_role[]
  )
);

drop policy if exists lesson_assets_update_editor on storage.objects;
create policy lesson_assets_update_editor
on storage.objects for update to authenticated
using (
  bucket_id = 'lesson-assets'
  and public.has_org_role(
    public.storage_object_org_id(name),
    array['owner', 'admin', 'editor']::public.organization_role[]
  )
)
with check (
  bucket_id = 'lesson-assets'
  and public.has_org_role(
    public.storage_object_org_id(name),
    array['owner', 'admin', 'editor']::public.organization_role[]
  )
);

drop policy if exists lesson_assets_delete_editor on storage.objects;
create policy lesson_assets_delete_editor
on storage.objects for delete to authenticated
using (
  bucket_id = 'lesson-assets'
  and public.has_org_role(
    public.storage_object_org_id(name),
    array['owner', 'admin', 'editor']::public.organization_role[]
  )
);

commit;

-- ============================================================
-- FILE: 08_views.sql
-- ============================================================

begin;

create or replace view public.course_overview
with (security_invoker = true)
as
select
  c.id,
  c.organization_id,
  c.owner_id,
  c.slug,
  c.title,
  c.description,
  c.language_code,
  c.source_level,
  c.target_level,
  c.status,
  c.visibility,
  c.current_release_id,
  c.updated_at,
  count(distinct cm.id) as module_count,
  count(distinct l.id) filter (where l.status <> 'archived') as lesson_count
from public.courses c
left join public.course_modules cm on cm.course_id = c.id
left join public.lessons l on l.course_id = c.id
group by c.id;

create or replace view public.learner_course_progress
with (security_invoker = true)
as
select
  ce.id as enrollment_id,
  ce.course_id,
  c.title as course_title,
  ce.release_id,
  ce.learner_id,
  ce.status,
  ce.progress_percent,
  ce.completed_lessons,
  ce.total_lessons,
  ce.started_at,
  ce.completed_at,
  ce.updated_at
from public.course_enrollments ce
join public.courses c on c.id = ce.course_id;

create or replace view public.course_analytics_summary
with (security_invoker = true)
as
select
  c.id as course_id,
  c.organization_id,
  count(distinct ce.id) as enrollment_count,
  count(distinct ce.learner_id) filter (where ce.status = 'active') as active_learner_count,
  count(distinct ce.id) filter (where ce.status = 'completed') as completed_enrollment_count,
  coalesce(round(avg(ce.progress_percent), 2), 0) as average_progress,
  coalesce(round(avg(la.score / nullif(la.max_score, 0) * 100), 2), 0) as average_score_percent
from public.courses c
left join public.course_enrollments ce on ce.course_id = c.id
left join public.lesson_attempts la on la.enrollment_id = ce.id and la.status = 'completed'
group by c.id, c.organization_id;

grant select on public.course_overview to authenticated;
grant select on public.learner_course_progress to authenticated;
grant select on public.course_analytics_summary to authenticated;

commit;

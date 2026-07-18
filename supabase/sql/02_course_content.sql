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

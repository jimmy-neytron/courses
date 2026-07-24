-- Course-authoring core. No organizations, learners, invites or integrations.
create table public.courses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  slug text not null check (slug ~ '^[a-z0-9][a-z0-9-]{1,99}$'),
  title text not null check (length(trim(title)) > 0),
  description text,
  language_code text not null default 'und' check (length(trim(language_code)) > 0),
  source_level text,
  target_level text,
  duration_weeks smallint check (duration_weeks is null or duration_weeks > 0),
  lessons_per_week smallint check (lessons_per_week is null or lessons_per_week > 0),
  default_lesson_duration smallint not null default 45 check (default_lesson_duration > 0),
  cover_path text,
  accent_color text not null default '#00DC82' check (accent_color ~ '^#[0-9A-Fa-f]{6}$'),
  status public.course_status not null default 'draft',
  visibility public.course_visibility not null default 'private',
  is_sequential boolean not null default true,
  current_release_id uuid,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, slug)
);

create table public.course_modules (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  title text not null check (length(trim(title)) > 0),
  description text,
  position integer not null default 0 check (position >= 0),
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, course_id)
);

create table public.lessons (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  module_id uuid not null,
  slug text not null check (slug ~ '^[a-z0-9][a-z0-9-]{1,99}$'),
  title text not null check (length(trim(title)) > 0),
  description text,
  objectives text[] not null default '{}',
  duration_minutes smallint not null default 45 check (duration_minutes > 0),
  passing_score numeric(5, 2) not null default 0 check (passing_score between 0 and 100),
  position integer not null default 0 check (position >= 0),
  status public.lesson_status not null default 'draft',
  is_preview boolean not null default false,
  is_completed boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint lessons_module_course_fk
    foreign key (module_id, course_id)
    references public.course_modules(id, course_id)
    on delete cascade,
  unique (course_id, slug),
  unique (id, course_id)
);

create table public.lesson_blocks (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null,
  lesson_id uuid not null,
  block_type text not null check (block_type in (
    'heading', 'rich_text', 'callout', 'image', 'audio', 'video', 'file',
    'vocabulary', 'flashcards', 'grammar', 'example', 'single_choice',
    'multiple_choice', 'text_input', 'fill_blanks', 'matching', 'ordering',
    'sentence_builder', 'translation', 'listening', 'open_answer',
    'divider', 'summary', 'homework'
  )),
  position integer not null default 0 check (position >= 0),
  title text,
  public_content jsonb not null default '{}' check (jsonb_typeof(public_content) = 'object'),
  private_content jsonb not null default '{}' check (jsonb_typeof(private_content) = 'object'),
  settings jsonb not null default '{}' check (jsonb_typeof(settings) = 'object'),
  is_required boolean not null default true,
  points numeric(8, 2) not null default 0 check (points >= 0),
  schema_version smallint not null default 1 check (schema_version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint lesson_blocks_lesson_course_fk
    foreign key (lesson_id, course_id)
    references public.lessons(id, course_id)
    on delete cascade
);

create table public.course_releases (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  version integer not null check (version > 0),
  snapshot jsonb not null check (jsonb_typeof(snapshot) = 'object'),
  module_count integer not null default 0,
  lesson_count integer not null default 0,
  changelog text,
  published_by uuid not null references public.profiles(id) on delete restrict,
  published_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (course_id, version)
);

alter table public.courses
  add constraint courses_current_release_fk
  foreign key (current_release_id)
  references public.course_releases(id)
  on delete set null;

create index courses_owner_updated_idx on public.courses(owner_id, updated_at desc);
create index course_modules_course_position_idx on public.course_modules(course_id, position);
create index lessons_module_position_idx on public.lessons(module_id, position);
create index lesson_blocks_lesson_position_idx on public.lesson_blocks(lesson_id, position);
create index course_releases_course_version_idx on public.course_releases(course_id, version desc);

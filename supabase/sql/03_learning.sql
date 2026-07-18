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

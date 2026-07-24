-- Adds an author-controlled completion mark to every lesson.
-- Safe to run more than once.

begin;

alter table public.lessons
  add column if not exists is_completed boolean not null default false;

commit;

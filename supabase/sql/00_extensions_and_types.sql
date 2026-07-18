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

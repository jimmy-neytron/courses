-- Existing database migration: keep authored courses and remove unfinished product areas.
--
-- BACK UP THE DATABASE BEFORE RUNNING THIS FILE.
-- Run it first on a Supabase branch or a separate test project.
--
-- Preserved data:
--   profiles, courses, course_modules, lessons, lesson_blocks, course_releases
--
-- Removed:
--   organizations and organization membership,
--   audit log,
--   learner memberships and invite codes,
--   integration clients, API keys, webhooks and idempotency.

begin;

-- Remove views whose definitions depend on features being deleted.
do $cleanup_views$
declare
  item record;
begin
  for item in
    select schemaname, viewname
    from pg_views
    where schemaname = 'public'
      and lower(definition) ~ '(organization_|audit_logs|course_memberships|course_invites|integration_|idempotency_keys|webhook_)'
  loop
    execute format('drop view if exists %I.%I cascade', item.schemaname, item.viewname);
  end loop;
end
$cleanup_views$;

-- Remove public functions/procedures that reference deleted product areas.
do $cleanup_routines$
declare
  item record;
begin
  for item in
    select
      namespace.nspname as schema_name,
      procedure.proname as routine_name,
      procedure.prokind,
      pg_get_function_identity_arguments(procedure.oid) as identity_arguments
    from pg_proc as procedure
    join pg_namespace as namespace on namespace.oid = procedure.pronamespace
    where namespace.nspname = 'public'
      and procedure.prokind in ('f', 'p')
      and (
        procedure.proname in ('join_course_by_code', 'regenerate_course_invite')
        or lower(pg_get_functiondef(procedure.oid)) ~ '(organization_|audit_logs|course_memberships|course_invites|integration_|idempotency_keys|webhook_)'
      )
  loop
    execute format(
      'drop %s if exists %I.%I(%s) cascade',
      case when item.prokind = 'p' then 'procedure' else 'function' end,
      item.schema_name,
      item.routine_name,
      item.identity_arguments
    );
  end loop;
end
$cleanup_routines$;

-- Drop existing policies on tables that remain. They are rebuilt as owner-only policies below.
do $cleanup_policies$
declare
  item record;
begin
  for item in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename in (
        'profiles', 'courses', 'course_modules',
        'lessons', 'lesson_blocks', 'course_releases'
      )
  loop
    execute format(
      'drop policy if exists %I on %I.%I',
      item.policyname,
      item.schemaname,
      item.tablename
    );
  end loop;
end
$cleanup_policies$;

-- Integration delivery chain: children before parents.
drop table if exists public.webhook_deliveries cascade;
drop table if exists public.webhook_events cascade;
drop table if exists public.idempotency_keys cascade;
drop table if exists public.integration_api_keys cascade;
drop table if exists public.integration_course_access cascade;
drop table if exists public.integration_clients cascade;

-- Learner access and invitations are not part of the authoring-only version.
drop table if exists public.course_invites cascade;
drop table if exists public.course_memberships cascade;

-- Audit and workspace layer.
drop table if exists public.audit_logs cascade;

-- Courses become directly owned by profiles.
alter table if exists public.courses
  drop column if exists organization_id cascade;

drop table if exists public.organization_members cascade;
drop table if exists public.organizations cascade;

-- Types used only by deleted features.
drop type if exists public.integration_status cascade;
drop type if exists public.webhook_event_status cascade;
drop type if exists public.organization_role cascade;

-- The owner field is now the only access boundary.
alter table public.courses alter column owner_id set not null;
alter table public.courses alter column accent_color set default '#00DC82';

alter table public.lessons
  add column if not exists is_completed boolean not null default false;

alter table public.profiles enable row level security;
alter table public.courses enable row level security;
alter table public.course_modules enable row level security;
alter table public.lessons enable row level security;
alter table public.lesson_blocks enable row level security;
alter table public.course_releases enable row level security;

create policy profiles_owner_select
on public.profiles
for select
to authenticated
using (id = auth.uid());

create policy profiles_owner_update
on public.profiles
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

create policy courses_owner_all
on public.courses
for all
to authenticated
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

create policy course_modules_owner_all
on public.course_modules
for all
to authenticated
using (
  exists (
    select 1 from public.courses
    where courses.id = course_modules.course_id
      and courses.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.courses
    where courses.id = course_modules.course_id
      and courses.owner_id = auth.uid()
  )
);

create policy lessons_owner_all
on public.lessons
for all
to authenticated
using (
  exists (
    select 1 from public.courses
    where courses.id = lessons.course_id
      and courses.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.courses
    where courses.id = lessons.course_id
      and courses.owner_id = auth.uid()
  )
);

create policy lesson_blocks_owner_all
on public.lesson_blocks
for all
to authenticated
using (
  exists (
    select 1 from public.courses
    where courses.id = lesson_blocks.course_id
      and courses.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.courses
    where courses.id = lesson_blocks.course_id
      and courses.owner_id = auth.uid()
  )
);

create policy course_releases_owner_all
on public.course_releases
for all
to authenticated
using (
  exists (
    select 1 from public.courses
    where courses.id = course_releases.course_id
      and courses.owner_id = auth.uid()
  )
)
with check (
  published_by = auth.uid()
  and exists (
    select 1 from public.courses
    where courses.id = course_releases.course_id
      and courses.owner_id = auth.uid()
  )
);

-- Rebuild publishing so it no longer depends on organizations or learner access.
-- Remove every previous publish_course overload so the return type/signature cannot conflict.
do $drop_publish_course$
declare
  item record;
begin
  for item in
    select
      namespace.nspname as schema_name,
      procedure.proname as routine_name,
      pg_get_function_identity_arguments(procedure.oid) as identity_arguments
    from pg_proc as procedure
    join pg_namespace as namespace on namespace.oid = procedure.pronamespace
    where namespace.nspname = 'public'
      and procedure.proname = 'publish_course'
      and procedure.prokind = 'f'
  loop
    execute format(
      'drop function if exists %I.%I(%s) cascade',
      item.schema_name,
      item.routine_name,
      item.identity_arguments
    );
  end loop;
end
$drop_publish_course$;

create or replace function public.publish_course(
  target_course_id uuid,
  release_changelog text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  release_id uuid;
  next_version integer;
  modules_total integer;
  lessons_total integer;
  release_snapshot jsonb;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if not exists (
    select 1 from public.courses
    where id = target_course_id and owner_id = auth.uid()
  ) then
    raise exception 'Course not found or access denied';
  end if;

  select coalesce(max(version), 0) + 1
  into next_version
  from public.course_releases
  where course_id = target_course_id;

  select count(*) into modules_total
  from public.course_modules
  where course_id = target_course_id;

  select count(*) into lessons_total
  from public.lessons
  where course_id = target_course_id;

  select jsonb_build_object(
    'course', to_jsonb(course_row),
    'modules', coalesce((
      select jsonb_agg(
        to_jsonb(module_row) || jsonb_build_object(
          'lessons', coalesce((
            select jsonb_agg(
              to_jsonb(lesson_row) || jsonb_build_object(
                'blocks', coalesce((
                  select jsonb_agg(to_jsonb(block_row) order by block_row.position)
                  from public.lesson_blocks block_row
                  where block_row.lesson_id = lesson_row.id
                ), '[]'::jsonb)
              ) order by lesson_row.position
            )
            from public.lessons lesson_row
            where lesson_row.module_id = module_row.id
          ), '[]'::jsonb)
        ) order by module_row.position
      )
      from public.course_modules module_row
      where module_row.course_id = target_course_id
    ), '[]'::jsonb)
  )
  into release_snapshot
  from public.courses course_row
  where course_row.id = target_course_id;

  insert into public.course_releases (
    course_id, version, snapshot, module_count,
    lesson_count, changelog, published_by
  )
  values (
    target_course_id, next_version, release_snapshot, modules_total,
    lessons_total, release_changelog, auth.uid()
  )
  returning id into release_id;

  update public.lessons
  set status = 'published', published_at = coalesce(published_at, now())
  where course_id = target_course_id and status = 'draft';

  update public.course_modules
  set is_published = true
  where course_id = target_course_id;

  update public.courses
  set status = 'published',
      published_at = coalesce(published_at, now()),
      current_release_id = release_id
  where id = target_course_id;

  return release_id;
end;
$$;

revoke all on function public.publish_course(uuid, text) from public;
grant execute on function public.publish_course(uuid, text) to authenticated;

commit;

-- Verification. The expected application tables are:
-- profiles, courses, course_modules, lessons, lesson_blocks, course_releases.
select table_name
from information_schema.tables
where table_schema = 'public'
  and table_type = 'BASE TABLE'
order by table_name;

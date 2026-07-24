create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    nullif(trim(coalesce(new.raw_user_meta_data ->> 'display_name', '')), '')
  )
  on conflict (id) do update
    set email = excluded.email,
        display_name = coalesce(excluded.display_name, public.profiles.display_name),
        updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert or update of email, raw_user_meta_data on auth.users
  for each row execute function public.handle_new_user();

-- Backfill profiles when Auth users already exist before this schema is applied.
insert into public.profiles (id, email, display_name)
select
  id,
  email,
  nullif(trim(coalesce(raw_user_meta_data ->> 'display_name', '')), '')
from auth.users
on conflict (id) do nothing;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists courses_set_updated_at on public.courses;
create trigger courses_set_updated_at
  before update on public.courses
  for each row execute function public.set_updated_at();

drop trigger if exists course_modules_set_updated_at on public.course_modules;
create trigger course_modules_set_updated_at
  before update on public.course_modules
  for each row execute function public.set_updated_at();

drop trigger if exists lessons_set_updated_at on public.lessons;
create trigger lessons_set_updated_at
  before update on public.lessons
  for each row execute function public.set_updated_at();

drop trigger if exists lesson_blocks_set_updated_at on public.lesson_blocks;
create trigger lesson_blocks_set_updated_at
  before update on public.lesson_blocks
  for each row execute function public.set_updated_at();

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
    select 1
    from public.courses
    where id = target_course_id
      and owner_id = auth.uid()
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
              )
              order by lesson_row.position
            )
            from public.lessons lesson_row
            where lesson_row.module_id = module_row.id
          ), '[]'::jsonb)
        )
        order by module_row.position
      )
      from public.course_modules module_row
      where module_row.course_id = target_course_id
    ), '[]'::jsonb)
  )
  into release_snapshot
  from public.courses course_row
  where course_row.id = target_course_id;

  insert into public.course_releases (
    course_id,
    version,
    snapshot,
    module_count,
    lesson_count,
    changelog,
    published_by
  )
  values (
    target_course_id,
    next_version,
    release_snapshot,
    modules_total,
    lessons_total,
    release_changelog,
    auth.uid()
  )
  returning id into release_id;

  update public.lessons
  set status = 'published',
      published_at = coalesce(published_at, now())
  where course_id = target_course_id
    and status = 'draft';

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

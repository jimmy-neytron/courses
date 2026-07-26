-- Read-only delivery of published courses for guests and authenticated users.
-- Matches the production schema: profiles, courses, course_modules, lessons and lesson_blocks.

begin;

create or replace function public.can_manage_course(p_course_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.courses c
    where c.id = p_course_id and c.owner_id = auth.uid()
  );
$$;

create or replace function public.can_access_course(p_course_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.courses c
    where c.id = p_course_id
      and (
        c.owner_id = auth.uid()
        or (
          c.status = 'published'
          and c.visibility in ('unlisted', 'public')
        )
      )
  );
$$;

drop policy if exists profiles_select_own on public.profiles;
drop policy if exists profiles_select_visible_owner on public.profiles;
create policy profiles_select_visible_owner
on public.profiles for select to anon, authenticated
using (
  id = auth.uid()
  or exists (
    select 1 from public.courses c
    where c.owner_id = profiles.id
      and c.status = 'published'
      and c.visibility in ('unlisted', 'public')
  )
);

drop policy if exists courses_select_member on public.courses;
drop policy if exists courses_select_accessible on public.courses;
create policy courses_select_accessible
on public.courses for select to anon, authenticated
using (public.can_access_course(id));

drop policy if exists modules_select_author on public.course_modules;
drop policy if exists modules_select_accessible on public.course_modules;
create policy modules_select_accessible
on public.course_modules for select to anon, authenticated
using (
  public.can_manage_course(course_id)
  or (is_published and public.can_access_course(course_id))
);

drop policy if exists lessons_select_author on public.lessons;
drop policy if exists lessons_select_accessible on public.lessons;
create policy lessons_select_accessible
on public.lessons for select to anon, authenticated
using (
  public.can_manage_course(course_id)
  or (status = 'published' and public.can_access_course(course_id))
);

drop policy if exists lesson_blocks_select_author on public.lesson_blocks;
drop policy if exists lesson_blocks_select_accessible on public.lesson_blocks;
create policy lesson_blocks_select_accessible
on public.lesson_blocks for select to anon, authenticated
using (
  public.can_manage_course(course_id)
  or exists (
    select 1 from public.lessons l
    where l.id = lesson_blocks.lesson_id
      and l.status = 'published'
      and public.can_access_course(l.course_id)
  )
);

drop policy if exists releases_select_author on public.course_releases;
drop policy if exists releases_select_accessible on public.course_releases;
create policy releases_select_accessible
on public.course_releases for select to anon, authenticated
using (public.can_access_course(course_id));

drop policy if exists lesson_assets_select_member on storage.objects;
drop policy if exists lesson_assets_select_public on storage.objects;
create policy lesson_assets_select_public
on storage.objects for select to anon, authenticated
using (
  bucket_id = 'lesson-assets'
  and array_length(storage.foldername(name), 1) >= 2
  and public.can_access_course((storage.foldername(name))[2]::uuid)
);

commit;
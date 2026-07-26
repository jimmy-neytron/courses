-- Published courses are readable by everyone. Drafts and all mutations belong
-- exclusively to the course owner.

begin;

alter table public.profiles enable row level security;
alter table public.courses enable row level security;
alter table public.course_modules enable row level security;
alter table public.lessons enable row level security;
alter table public.lesson_blocks enable row level security;
alter table public.course_releases enable row level security;

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
        or (c.status = 'published' and c.visibility in ('public', 'unlisted'))
      )
  );
$$;

-- Profiles of public course authors are readable for attribution.
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
      and c.visibility in ('public', 'unlisted')
  )
);

-- Courses: public/published read, owner-only draft read and mutations.
drop policy if exists courses_select_member on public.courses;
drop policy if exists courses_select_accessible on public.courses;
create policy courses_select_accessible
on public.courses for select to anon, authenticated
using (public.can_access_course(id));

drop policy if exists courses_insert_editor on public.courses;
drop policy if exists courses_insert_owner on public.courses;
create policy courses_insert_owner
on public.courses for insert to authenticated
with check (owner_id = auth.uid());

drop policy if exists courses_update_editor on public.courses;
drop policy if exists courses_update_owner on public.courses;
create policy courses_update_owner
on public.courses for update to authenticated
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

drop policy if exists courses_delete_editor on public.courses;
drop policy if exists courses_delete_owner on public.courses;
create policy courses_delete_owner
on public.courses for delete to authenticated
using (owner_id = auth.uid());

-- Modules.
drop policy if exists modules_select_author on public.course_modules;
drop policy if exists modules_select_accessible on public.course_modules;
create policy modules_select_accessible
on public.course_modules for select to anon, authenticated
using (
  public.can_manage_course(course_id)
  or (is_published and public.can_access_course(course_id))
);

drop policy if exists modules_insert_editor on public.course_modules;
drop policy if exists modules_insert_owner on public.course_modules;
create policy modules_insert_owner on public.course_modules for insert to authenticated
with check (public.can_manage_course(course_id));

drop policy if exists modules_update_editor on public.course_modules;
drop policy if exists modules_update_owner on public.course_modules;
create policy modules_update_owner on public.course_modules for update to authenticated
using (public.can_manage_course(course_id))
with check (public.can_manage_course(course_id));

drop policy if exists modules_delete_editor on public.course_modules;
drop policy if exists modules_delete_owner on public.course_modules;
create policy modules_delete_owner on public.course_modules for delete to authenticated
using (public.can_manage_course(course_id));

-- Lessons.
drop policy if exists lessons_select_author on public.lessons;
drop policy if exists lessons_select_accessible on public.lessons;
create policy lessons_select_accessible
on public.lessons for select to anon, authenticated
using (
  public.can_manage_course(course_id)
  or (status = 'published' and public.can_access_course(course_id))
);

drop policy if exists lessons_insert_editor on public.lessons;
drop policy if exists lessons_insert_owner on public.lessons;
create policy lessons_insert_owner on public.lessons for insert to authenticated
with check (public.can_manage_course(course_id));

drop policy if exists lessons_update_editor on public.lessons;
drop policy if exists lessons_update_owner on public.lessons;
create policy lessons_update_owner on public.lessons for update to authenticated
using (public.can_manage_course(course_id))
with check (public.can_manage_course(course_id));

drop policy if exists lessons_delete_editor on public.lessons;
drop policy if exists lessons_delete_owner on public.lessons;
create policy lessons_delete_owner on public.lessons for delete to authenticated
using (public.can_manage_course(course_id));

-- Lesson blocks.
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

drop policy if exists lesson_blocks_insert_editor on public.lesson_blocks;
drop policy if exists lesson_blocks_insert_owner on public.lesson_blocks;
create policy lesson_blocks_insert_owner on public.lesson_blocks for insert to authenticated
with check (public.can_manage_course(course_id));

drop policy if exists lesson_blocks_update_editor on public.lesson_blocks;
drop policy if exists lesson_blocks_update_owner on public.lesson_blocks;
create policy lesson_blocks_update_owner on public.lesson_blocks for update to authenticated
using (public.can_manage_course(course_id))
with check (public.can_manage_course(course_id));

drop policy if exists lesson_blocks_delete_editor on public.lesson_blocks;
drop policy if exists lesson_blocks_delete_owner on public.lesson_blocks;
create policy lesson_blocks_delete_owner on public.lesson_blocks for delete to authenticated
using (public.can_manage_course(course_id));

-- Immutable publication snapshots remain readable with the course.
drop policy if exists releases_select_author on public.course_releases;
drop policy if exists releases_select_accessible on public.course_releases;
create policy releases_select_accessible on public.course_releases for select to anon, authenticated
using (public.can_access_course(course_id));

drop policy if exists releases_insert_owner on public.course_releases;
create policy releases_insert_owner on public.course_releases for insert to authenticated
with check (public.can_manage_course(course_id));

drop policy if exists releases_update_owner on public.course_releases;
create policy releases_update_owner on public.course_releases for update to authenticated
using (public.can_manage_course(course_id))
with check (public.can_manage_course(course_id));

drop policy if exists releases_delete_owner on public.course_releases;
create policy releases_delete_owner on public.course_releases for delete to authenticated
using (public.can_manage_course(course_id));

commit;
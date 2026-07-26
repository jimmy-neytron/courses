-- Published course means the whole course tree is readable. Draft courses stay
-- visible only to their owner; mutations are still owner-only.

begin;

grant usage on schema public to anon, authenticated;
grant select on table public.profiles to anon, authenticated;
grant select on table public.courses to anon, authenticated;
grant select on table public.course_modules to anon, authenticated;
grant select on table public.lessons to anon, authenticated;
grant select on table public.lesson_blocks to anon, authenticated;
grant select on table public.course_releases to anon, authenticated;

grant insert, update, delete on table public.courses to authenticated;
grant insert, update, delete on table public.course_modules to authenticated;
grant insert, update, delete on table public.lessons to authenticated;
grant insert, update, delete on table public.lesson_blocks to authenticated;
grant insert, update, delete on table public.course_releases to authenticated;

grant execute on function public.can_manage_course(uuid) to anon, authenticated;
grant execute on function public.can_access_course(uuid) to anon, authenticated;

create or replace function public.can_access_course(p_course_id uuid)
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
      and (
        c.owner_id = auth.uid()
        or (c.status = 'published' and c.visibility = 'public')
      )
  );
$$;

drop policy if exists modules_select_accessible on public.course_modules;
create policy modules_select_accessible
on public.course_modules for select to anon, authenticated
using (public.can_access_course(course_id));

drop policy if exists lessons_select_accessible on public.lessons;
create policy lessons_select_accessible
on public.lessons for select to anon, authenticated
using (public.can_access_course(course_id));

drop policy if exists lesson_blocks_select_accessible on public.lesson_blocks;
create policy lesson_blocks_select_accessible
on public.lesson_blocks for select to anon, authenticated
using (public.can_access_course(course_id));

commit;
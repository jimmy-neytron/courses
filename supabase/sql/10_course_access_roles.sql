-- Course access roles without learner analytics or progress tables.
-- The canonical creator is courses.owner_id; course_memberships contains learners only.

begin;

create table if not exists public.course_memberships (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'learner',
  joined_at timestamptz not null default now(),
  unique (course_id, user_id),
  constraint course_memberships_role_check check (role = 'learner')
);


create index if not exists course_memberships_user_joined_idx
  on public.course_memberships(user_id, joined_at desc);


create or replace function public.can_manage_course(p_course_id uuid)
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
      and c.owner_id = auth.uid()
  );
$$;

create or replace function public.can_view_course_as_author(p_course_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.can_manage_course(p_course_id);
$$;

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
        or exists (
          select 1
          from public.course_memberships cm
          where cm.course_id = c.id
            and cm.user_id = auth.uid()
        )
      )
  );
$$;

create or replace function public.shares_course(p_other_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.courses c
    left join public.course_memberships cm on cm.course_id = c.id
    where (
      c.owner_id = auth.uid()
      and cm.user_id = p_other_user_id
    ) or (
      c.owner_id = p_other_user_id
      and cm.user_id = auth.uid()
    )
  );
$$;


alter table public.course_memberships enable row level security;

drop policy if exists course_memberships_select_related on public.course_memberships;
create policy course_memberships_select_related
on public.course_memberships for select to authenticated
using (user_id = auth.uid() or public.can_manage_course(course_id));

drop policy if exists course_memberships_delete_related on public.course_memberships;
create policy course_memberships_delete_related
on public.course_memberships for delete to authenticated
using (user_id = auth.uid() or public.can_manage_course(course_id));


drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own
on public.profiles for select to authenticated
using (
  id = auth.uid()
  or public.shares_organization(id)
  or public.shares_course(id)
);

drop policy if exists courses_select_member on public.courses;
drop policy if exists courses_select_accessible on public.courses;
create policy courses_select_accessible
on public.courses for select to authenticated
using (public.can_access_course(id));

drop policy if exists courses_update_editor on public.courses;
drop policy if exists courses_update_creator on public.courses;
create policy courses_update_creator
on public.courses for update to authenticated
using (public.can_manage_course(id))
with check (owner_id = auth.uid() and public.can_manage_course(id));

drop policy if exists courses_delete_editor on public.courses;
drop policy if exists courses_delete_creator on public.courses;
create policy courses_delete_creator
on public.courses for delete to authenticated
using (public.can_manage_course(id));

drop policy if exists modules_select_author on public.course_modules;
drop policy if exists modules_select_accessible on public.course_modules;
create policy modules_select_accessible
on public.course_modules for select to authenticated
using (public.can_access_course(course_id));

drop policy if exists lessons_select_author on public.lessons;
drop policy if exists lessons_select_accessible on public.lessons;
create policy lessons_select_accessible
on public.lessons for select to authenticated
using (public.can_access_course(course_id));

drop policy if exists lesson_blocks_select_author on public.lesson_blocks;
drop policy if exists lesson_blocks_select_accessible on public.lesson_blocks;
create policy lesson_blocks_select_accessible
on public.lesson_blocks for select to authenticated
using (public.can_access_course(course_id));

drop policy if exists releases_select_author on public.course_releases;
drop policy if exists releases_select_accessible on public.course_releases;
create policy releases_select_accessible
on public.course_releases for select to authenticated
using (public.can_access_course(course_id));


commit;

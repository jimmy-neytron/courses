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

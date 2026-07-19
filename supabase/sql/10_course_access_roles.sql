-- Course access roles without restoring learner analytics or progress tables.
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

create table if not exists public.course_invites (
  course_id uuid primary key references public.courses(id) on delete cascade,
  code text not null unique default upper(substr(encode(gen_random_bytes(6), 'hex'), 1, 10)),
  created_by uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint course_invites_code_format check (code ~ '^[A-Z0-9]{8,12}$')
);

create index if not exists course_memberships_user_joined_idx
  on public.course_memberships(user_id, joined_at desc);

create or replace function public.ensure_course_invite()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.course_invites (course_id, created_by)
  values (new.id, new.owner_id)
  on conflict (course_id) do nothing;
  return new;
end;
$$;

drop trigger if exists ensure_course_invite_on_create on public.courses;
create trigger ensure_course_invite_on_create
  after insert on public.courses
  for each row execute procedure public.ensure_course_invite();

insert into public.course_invites (course_id, created_by)
select c.id, c.owner_id
from public.courses c
where not exists (
  select 1 from public.course_invites ci where ci.course_id = c.id
);

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

create or replace function public.join_course_by_code(p_code text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_course_id uuid;
  v_owner_id uuid;
  v_status public.course_status;
begin
  if auth.uid() is null then
    raise exception 'UNAUTHENTICATED';
  end if;

  select c.id, c.owner_id, c.status
  into v_course_id, v_owner_id, v_status
  from public.course_invites ci
  join public.courses c on c.id = ci.course_id
  where ci.code = upper(trim(p_code));

  if v_course_id is null then
    raise exception 'COURSE_INVITE_NOT_FOUND';
  end if;

  if v_status <> 'published' then
    raise exception 'COURSE_NOT_PUBLISHED';
  end if;

  if v_owner_id <> auth.uid() then
    insert into public.course_memberships (course_id, user_id)
    values (v_course_id, auth.uid())
    on conflict (course_id, user_id) do nothing;
  end if;

  return v_course_id;
end;
$$;

create or replace function public.regenerate_course_invite(p_course_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code text;
begin
  if not public.can_manage_course(p_course_id) then
    raise exception 'FORBIDDEN';
  end if;

  v_code := upper(substr(encode(gen_random_bytes(6), 'hex'), 1, 10));
  update public.course_invites
  set code = v_code, updated_at = now()
  where course_id = p_course_id;
  return v_code;
end;
$$;

alter table public.course_memberships enable row level security;
alter table public.course_invites enable row level security;

drop policy if exists course_memberships_select_related on public.course_memberships;
create policy course_memberships_select_related
on public.course_memberships for select to authenticated
using (user_id = auth.uid() or public.can_manage_course(course_id));

drop policy if exists course_memberships_delete_related on public.course_memberships;
create policy course_memberships_delete_related
on public.course_memberships for delete to authenticated
using (user_id = auth.uid() or public.can_manage_course(course_id));

drop policy if exists course_invites_select_creator on public.course_invites;
create policy course_invites_select_creator
on public.course_invites for select to authenticated
using (public.can_manage_course(course_id));

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

revoke all on function public.join_course_by_code(text) from public;
grant execute on function public.join_course_by_code(text) to authenticated;
revoke all on function public.regenerate_course_invite(uuid) from public;
grant execute on function public.regenerate_course_invite(uuid) to authenticated;

commit;

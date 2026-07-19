-- Removes the learner/progress/analytics subsystem.
-- WARNING: rows in the tables below are deleted permanently.
-- Course authoring, publishing, organizations, profiles and storage are preserved.

begin;

-- Views depend on enrollment and attempt tables and must be removed first.
drop view if exists public.course_analytics_summary;
drop view if exists public.learner_course_progress;

-- A policy on learners reads course_enrollments. PostgreSQL treats that
-- cross-table reference as a dependency, so remove learner policies before
-- dropping the enrollment table. Policies attached to the other tables are
-- removed automatically together with their own tables.
do $cleanup_policies$
begin
  if to_regclass('public.learners') is not null then
    execute 'drop policy if exists learners_select_own_or_manager on public.learners';
    execute 'drop policy if exists learners_update_own on public.learners';
  end if;
end
$cleanup_policies$;

-- Keep signup working after public.learners is removed.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid := gen_random_uuid();
  v_display_name text;
  v_slug text;
begin
  v_display_name := coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
    split_part(coalesce(new.email, 'user'), '@', 1)
  );

  v_slug := 'workspace-' || left(replace(new.id::text, '-', ''), 12);

  insert into public.profiles (id, email, display_name)
  values (new.id, new.email, v_display_name)
  on conflict (id) do nothing;

  insert into public.organizations (id, owner_id, name, slug)
  values (v_org_id, new.id, coalesce(v_display_name, 'My') || ' Workspace', v_slug);

  insert into public.organization_members (organization_id, user_id, role)
  values (v_org_id, new.id, 'owner');

  return new;
end;
$$;

-- Remove dependent integration/session data before the learner table.
drop table if exists public.embed_sessions;
drop table if exists public.learner_external_identities;

-- Remove learning state from the leaves towards the root.
drop table if exists public.learner_notes;
drop table if exists public.lesson_block_progress;
drop table if exists public.lesson_attempts;
drop table if exists public.course_enrollments;
drop table if exists public.learners;

-- Trigger functions are no longer needed after their tables are gone.
drop function if exists public.recalculate_enrollment_progress();
drop function if exists public.initialize_enrollment_totals();

-- These enum types were used only by the removed learning subsystem.
drop type if exists public.attempt_status;
drop type if exists public.enrollment_status;

commit;

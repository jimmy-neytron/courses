begin;

alter table public.profiles enable row level security;
alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.audit_logs enable row level security;
alter table public.courses enable row level security;
alter table public.course_modules enable row level security;
alter table public.lessons enable row level security;
alter table public.lesson_blocks enable row level security;
alter table public.course_releases enable row level security;
alter table public.learners enable row level security;
alter table public.course_enrollments enable row level security;
alter table public.lesson_attempts enable row level security;
alter table public.lesson_block_progress enable row level security;
alter table public.learner_notes enable row level security;
alter table public.integration_clients enable row level security;
alter table public.integration_course_access enable row level security;
alter table public.integration_api_keys enable row level security;
alter table public.learner_external_identities enable row level security;
alter table public.embed_sessions enable row level security;
alter table public.idempotency_keys enable row level security;
alter table public.webhook_events enable row level security;
alter table public.webhook_deliveries enable row level security;

-- Profiles

drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own
on public.profiles for select to authenticated
using (id = auth.uid() or public.shares_organization(id));

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own
on public.profiles for update to authenticated
using (id = auth.uid())
with check (id = auth.uid());

-- Organizations

drop policy if exists organizations_select_member on public.organizations;
create policy organizations_select_member
on public.organizations for select to authenticated
using (public.is_org_member(id));

-- Organization creation is performed through public.create_organization().

drop policy if exists organizations_update_admin on public.organizations;
create policy organizations_update_admin
on public.organizations for update to authenticated
using (public.has_org_role(id, array['owner', 'admin']::public.organization_role[]))
with check (public.has_org_role(id, array['owner', 'admin']::public.organization_role[]));

drop policy if exists organizations_delete_owner on public.organizations;
create policy organizations_delete_owner
on public.organizations for delete to authenticated
using (public.has_org_role(id, array['owner']::public.organization_role[]));

-- Organization members

drop policy if exists organization_members_select_member on public.organization_members;
create policy organization_members_select_member
on public.organization_members for select to authenticated
using (public.is_org_member(organization_id));

drop policy if exists organization_members_insert_admin on public.organization_members;
create policy organization_members_insert_admin
on public.organization_members for insert to authenticated
with check (
  public.has_org_role(
    organization_id,
    array['owner', 'admin']::public.organization_role[]
  )
);

drop policy if exists organization_members_update_admin on public.organization_members;
create policy organization_members_update_admin
on public.organization_members for update to authenticated
using (
  public.has_org_role(
    organization_id,
    array['owner', 'admin']::public.organization_role[]
  )
)
with check (
  public.has_org_role(
    organization_id,
    array['owner', 'admin']::public.organization_role[]
  )
);

drop policy if exists organization_members_delete_admin on public.organization_members;
create policy organization_members_delete_admin
on public.organization_members for delete to authenticated
using (
  public.has_org_role(
    organization_id,
    array['owner', 'admin']::public.organization_role[]
  )
);

-- Audit logs are read-only from the app.

drop policy if exists audit_logs_select_admin on public.audit_logs;
create policy audit_logs_select_admin
on public.audit_logs for select to authenticated
using (
  organization_id is not null
  and public.has_org_role(
    organization_id,
    array['owner', 'admin']::public.organization_role[]
  )
);

-- Course authoring tables. Learner delivery uses Edge Functions, not direct Data API.

drop policy if exists courses_select_member on public.courses;
create policy courses_select_member
on public.courses for select to authenticated
using (public.is_org_member(organization_id));

drop policy if exists courses_insert_editor on public.courses;
create policy courses_insert_editor
on public.courses for insert to authenticated
with check (
  owner_id = auth.uid()
  and public.has_org_role(
    organization_id,
    array['owner', 'admin', 'editor']::public.organization_role[]
  )
);

drop policy if exists courses_update_editor on public.courses;
create policy courses_update_editor
on public.courses for update to authenticated
using (public.can_manage_course(id))
with check (
  public.has_org_role(
    organization_id,
    array['owner', 'admin', 'editor']::public.organization_role[]
  )
);

drop policy if exists courses_delete_editor on public.courses;
create policy courses_delete_editor
on public.courses for delete to authenticated
using (public.can_manage_course(id));

drop policy if exists modules_select_author on public.course_modules;
create policy modules_select_author
on public.course_modules for select to authenticated
using (public.can_view_course_as_author(course_id));

drop policy if exists modules_insert_editor on public.course_modules;
create policy modules_insert_editor
on public.course_modules for insert to authenticated
with check (public.can_manage_course(course_id));

drop policy if exists modules_update_editor on public.course_modules;
create policy modules_update_editor
on public.course_modules for update to authenticated
using (public.can_manage_course(course_id))
with check (public.can_manage_course(course_id));

drop policy if exists modules_delete_editor on public.course_modules;
create policy modules_delete_editor
on public.course_modules for delete to authenticated
using (public.can_manage_course(course_id));

drop policy if exists lessons_select_author on public.lessons;
create policy lessons_select_author
on public.lessons for select to authenticated
using (public.can_view_course_as_author(course_id));

drop policy if exists lessons_insert_editor on public.lessons;
create policy lessons_insert_editor
on public.lessons for insert to authenticated
with check (public.can_manage_course(course_id));

drop policy if exists lessons_update_editor on public.lessons;
create policy lessons_update_editor
on public.lessons for update to authenticated
using (public.can_manage_course(course_id))
with check (public.can_manage_course(course_id));

drop policy if exists lessons_delete_editor on public.lessons;
create policy lessons_delete_editor
on public.lessons for delete to authenticated
using (public.can_manage_course(course_id));

drop policy if exists lesson_blocks_select_author on public.lesson_blocks;
create policy lesson_blocks_select_author
on public.lesson_blocks for select to authenticated
using (public.can_view_course_as_author(course_id));

drop policy if exists lesson_blocks_insert_editor on public.lesson_blocks;
create policy lesson_blocks_insert_editor
on public.lesson_blocks for insert to authenticated
with check (public.can_manage_course(course_id));

drop policy if exists lesson_blocks_update_editor on public.lesson_blocks;
create policy lesson_blocks_update_editor
on public.lesson_blocks for update to authenticated
using (public.can_manage_course(course_id))
with check (public.can_manage_course(course_id));

drop policy if exists lesson_blocks_delete_editor on public.lesson_blocks;
create policy lesson_blocks_delete_editor
on public.lesson_blocks for delete to authenticated
using (public.can_manage_course(course_id));

drop policy if exists releases_select_author on public.course_releases;
create policy releases_select_author
on public.course_releases for select to authenticated
using (public.can_view_course_as_author(course_id));

-- Learners

drop policy if exists learners_select_own_or_manager on public.learners;
create policy learners_select_own_or_manager
on public.learners for select to authenticated
using (
  user_id = auth.uid()
  or exists (
    select 1
    from public.course_enrollments ce
    where ce.learner_id = learners.id
      and public.can_view_course_as_author(ce.course_id)
  )
);

drop policy if exists learners_update_own on public.learners;
create policy learners_update_own
on public.learners for update to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists enrollments_select_own_or_manager on public.course_enrollments;
create policy enrollments_select_own_or_manager
on public.course_enrollments for select to authenticated
using (
  exists (
    select 1 from public.learners l
    where l.id = learner_id and l.user_id = auth.uid()
  )
  or public.can_view_course_as_author(course_id)
);

drop policy if exists enrollments_insert_manager on public.course_enrollments;
create policy enrollments_insert_manager
on public.course_enrollments for insert to authenticated
with check (public.can_manage_course(course_id));

drop policy if exists enrollments_update_manager on public.course_enrollments;
create policy enrollments_update_manager
on public.course_enrollments for update to authenticated
using (public.can_manage_course(course_id))
with check (public.can_manage_course(course_id));

drop policy if exists enrollments_delete_manager on public.course_enrollments;
create policy enrollments_delete_manager
on public.course_enrollments for delete to authenticated
using (public.can_manage_course(course_id));

-- Attempts and block progress are written only by trusted Edge Functions.

drop policy if exists attempts_select_own_or_manager on public.lesson_attempts;
create policy attempts_select_own_or_manager
on public.lesson_attempts for select to authenticated
using (
  exists (
    select 1 from public.learners l
    where l.id = learner_id and l.user_id = auth.uid()
  )
  or public.can_view_course_as_author(course_id)
);

drop policy if exists block_progress_select_own_or_manager on public.lesson_block_progress;
create policy block_progress_select_own_or_manager
on public.lesson_block_progress for select to authenticated
using (
  exists (
    select 1 from public.learners l
    where l.id = learner_id and l.user_id = auth.uid()
  )
  or exists (
    select 1 from public.lesson_attempts la
    where la.id = attempt_id
      and public.can_view_course_as_author(la.course_id)
  )
);

-- Notes can be managed directly only by the owning internal learner.

drop policy if exists learner_notes_select_own on public.learner_notes;
create policy learner_notes_select_own
on public.learner_notes for select to authenticated
using (
  exists (
    select 1 from public.learners l
    where l.id = learner_id and l.user_id = auth.uid()
  )
);

drop policy if exists learner_notes_insert_own on public.learner_notes;
create policy learner_notes_insert_own
on public.learner_notes for insert to authenticated
with check (
  exists (
    select 1 from public.learners l
    where l.id = learner_id and l.user_id = auth.uid()
  )
);

drop policy if exists learner_notes_update_own on public.learner_notes;
create policy learner_notes_update_own
on public.learner_notes for update to authenticated
using (
  exists (
    select 1 from public.learners l
    where l.id = learner_id and l.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.learners l
    where l.id = learner_id and l.user_id = auth.uid()
  )
);

drop policy if exists learner_notes_delete_own on public.learner_notes;
create policy learner_notes_delete_own
on public.learner_notes for delete to authenticated
using (
  exists (
    select 1 from public.learners l
    where l.id = learner_id and l.user_id = auth.uid()
  )
);

-- Integrations

drop policy if exists integrations_select_admin on public.integration_clients;
create policy integrations_select_admin
on public.integration_clients for select to authenticated
using (
  public.has_org_role(
    organization_id,
    array['owner', 'admin']::public.organization_role[]
  )
);

drop policy if exists integrations_insert_admin on public.integration_clients;
create policy integrations_insert_admin
on public.integration_clients for insert to authenticated
with check (
  created_by = auth.uid()
  and public.has_org_role(
    organization_id,
    array['owner', 'admin']::public.organization_role[]
  )
);

drop policy if exists integrations_update_admin on public.integration_clients;
create policy integrations_update_admin
on public.integration_clients for update to authenticated
using (
  public.has_org_role(
    organization_id,
    array['owner', 'admin']::public.organization_role[]
  )
)
with check (
  public.has_org_role(
    organization_id,
    array['owner', 'admin']::public.organization_role[]
  )
);

drop policy if exists integrations_delete_owner on public.integration_clients;
create policy integrations_delete_owner
on public.integration_clients for delete to authenticated
using (
  public.has_org_role(
    organization_id,
    array['owner']::public.organization_role[]
  )
);

drop policy if exists integration_access_select_admin on public.integration_course_access;
create policy integration_access_select_admin
on public.integration_course_access for select to authenticated
using (
  exists (
    select 1 from public.integration_clients ic
    where ic.id = integration_id
      and public.has_org_role(
        ic.organization_id,
        array['owner', 'admin']::public.organization_role[]
      )
  )
);

drop policy if exists integration_access_manage_admin on public.integration_course_access;
create policy integration_access_manage_admin
on public.integration_course_access for all to authenticated
using (
  exists (
    select 1 from public.integration_clients ic
    where ic.id = integration_id
      and public.has_org_role(
        ic.organization_id,
        array['owner', 'admin']::public.organization_role[]
      )
  )
)
with check (
  exists (
    select 1 from public.integration_clients ic
    where ic.id = integration_id
      and public.has_org_role(
        ic.organization_id,
        array['owner', 'admin']::public.organization_role[]
      )
  )
);

-- API key hashes, external identities, embed sessions and idempotency keys have
-- no authenticated policies. They are accessed through security-definer RPCs
-- or trusted Edge Functions only.

-- Webhook monitoring is read-only for organization admins.

drop policy if exists webhook_events_select_admin on public.webhook_events;
create policy webhook_events_select_admin
on public.webhook_events for select to authenticated
using (
  exists (
    select 1 from public.integration_clients ic
    where ic.id = integration_id
      and public.has_org_role(
        ic.organization_id,
        array['owner', 'admin']::public.organization_role[]
      )
  )
);

drop policy if exists webhook_deliveries_select_admin on public.webhook_deliveries;
create policy webhook_deliveries_select_admin
on public.webhook_deliveries for select to authenticated
using (
  exists (
    select 1
    from public.webhook_events we
    join public.integration_clients ic on ic.id = we.integration_id
    where we.id = event_id
      and public.has_org_role(
        ic.organization_id,
        array['owner', 'admin']::public.organization_role[]
      )
  )
);

commit;

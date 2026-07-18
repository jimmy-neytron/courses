begin;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.is_org_member(p_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organization_members om
    where om.organization_id = p_organization_id
      and om.user_id = auth.uid()
  );
$$;

create or replace function public.has_org_role(
  p_organization_id uuid,
  p_roles public.organization_role[]
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organization_members om
    where om.organization_id = p_organization_id
      and om.user_id = auth.uid()
      and om.role = any(p_roles)
  );
$$;

create or replace function public.shares_organization(p_other_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organization_members mine
    join public.organization_members theirs
      on theirs.organization_id = mine.organization_id
    where mine.user_id = auth.uid()
      and theirs.user_id = p_other_user_id
  );
$$;

create or replace function public.create_organization(
  p_name text,
  p_slug text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
begin
  if auth.uid() is null then
    raise exception 'UNAUTHENTICATED';
  end if;

  if length(trim(p_name)) = 0 then
    raise exception 'INVALID_NAME';
  end if;

  if p_slug !~ '^[a-z0-9][a-z0-9-]{2,63}$' then
    raise exception 'INVALID_SLUG';
  end if;

  insert into public.organizations (owner_id, name, slug)
  values (auth.uid(), trim(p_name), p_slug)
  returning id into v_org_id;

  insert into public.organization_members (organization_id, user_id, role)
  values (v_org_id, auth.uid(), 'owner');

  return v_org_id;
end;
$$;

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
    join public.organization_members om
      on om.organization_id = c.organization_id
    where c.id = p_course_id
      and om.user_id = auth.uid()
      and om.role in ('owner', 'admin', 'editor')
  );
$$;

create or replace function public.can_view_course_as_author(p_course_id uuid)
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
      and public.is_org_member(c.organization_id)
  );
$$;

create or replace function public.storage_object_org_id(p_name text)
returns uuid
language plpgsql
immutable
as $$
declare
  v_part text;
begin
  v_part := split_part(p_name, '/', 1);

  if v_part ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' then
    return v_part::uuid;
  end if;

  return null;
end;
$$;

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

  insert into public.learners (user_id, display_name, email)
  values (new.id, v_display_name, new.email)
  on conflict (user_id) do nothing;

  insert into public.organizations (id, owner_id, name, slug)
  values (v_org_id, new.id, coalesce(v_display_name, 'My') || ' Workspace', v_slug);

  insert into public.organization_members (organization_id, user_id, role)
  values (v_org_id, new.id, 'owner');

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create or replace function public.publish_course(
  p_course_id uuid,
  p_changelog text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_release_id uuid;
  v_version integer;
  v_snapshot jsonb;
  v_module_count integer;
  v_lesson_count integer;
  v_org_id uuid;
begin
  if not public.can_manage_course(p_course_id) then
    raise exception 'FORBIDDEN';
  end if;

  select organization_id into v_org_id
  from public.courses
  where id = p_course_id;

  select count(*) into v_module_count
  from public.course_modules
  where course_id = p_course_id;

  select count(*) into v_lesson_count
  from public.lessons
  where course_id = p_course_id
    and status <> 'archived';

  if v_module_count = 0 then
    raise exception 'COURSE_HAS_NO_MODULES';
  end if;

  if v_lesson_count = 0 then
    raise exception 'COURSE_HAS_NO_LESSONS';
  end if;

  select coalesce(max(cr.version), 0) + 1
  into v_version
  from public.course_releases cr
  where cr.course_id = p_course_id;

  select jsonb_build_object(
    'schemaVersion', 1,
    'course', jsonb_build_object(
      'id', c.id,
      'slug', c.slug,
      'title', c.title,
      'description', c.description,
      'languageCode', c.language_code,
      'sourceLevel', c.source_level,
      'targetLevel', c.target_level,
      'durationWeeks', c.duration_weeks,
      'lessonsPerWeek', c.lessons_per_week,
      'defaultLessonDuration', c.default_lesson_duration,
      'coverPath', c.cover_path,
      'accentColor', c.accent_color,
      'isSequential', c.is_sequential
    ),
    'modules', coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'id', m.id,
            'title', m.title,
            'description', m.description,
            'position', m.position,
            'lessons', coalesce(
              (
                select jsonb_agg(
                  jsonb_build_object(
                    'id', l.id,
                    'slug', l.slug,
                    'title', l.title,
                    'description', l.description,
                    'objectives', l.objectives,
                    'durationMinutes', l.duration_minutes,
                    'passingScore', l.passing_score,
                    'position', l.position,
                    'isPreview', l.is_preview,
                    'blocks', coalesce(
                      (
                        select jsonb_agg(
                          jsonb_build_object(
                            'id', b.id,
                            'blockType', b.block_type,
                            'position', b.position,
                            'title', b.title,
                            'publicContent', b.public_content,
                            'privateContent', b.private_content,
                            'settings', b.settings,
                            'isRequired', b.is_required,
                            'points', b.points,
                            'schemaVersion', b.schema_version
                          ) order by b.position, b.created_at
                        )
                        from public.lesson_blocks b
                        where b.lesson_id = l.id
                      ),
                      '[]'::jsonb
                    )
                  ) order by l.position, l.created_at
                )
                from public.lessons l
                where l.module_id = m.id
                  and l.status <> 'archived'
              ),
              '[]'::jsonb
            )
          ) order by m.position, m.created_at
        )
        from public.course_modules m
        where m.course_id = c.id
      ),
      '[]'::jsonb
    )
  )
  into v_snapshot
  from public.courses c
  where c.id = p_course_id;

  if v_snapshot is null then
    raise exception 'COURSE_NOT_FOUND';
  end if;

  insert into public.course_releases (
    course_id, version, snapshot, module_count, lesson_count, changelog, published_by
  )
  values (
    p_course_id, v_version, v_snapshot, v_module_count, v_lesson_count, p_changelog, auth.uid()
  )
  returning id into v_release_id;

  update public.courses
  set current_release_id = v_release_id,
      status = 'published',
      published_at = now(),
      updated_at = now()
  where id = p_course_id;

  insert into public.audit_logs (
    organization_id, actor_user_id, action, entity_type, entity_id, metadata
  ) values (
    v_org_id,
    auth.uid(),
    'course.published',
    'course',
    p_course_id::text,
    jsonb_build_object('releaseId', v_release_id, 'version', v_version)
  );

  return v_release_id;
end;
$$;

create or replace function public.create_integration_api_key(
  p_integration_id uuid,
  p_name text,
  p_expires_at timestamptz default null
)
returns table (api_key_id uuid, api_key text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
  v_raw_key text;
  v_key_hash text;
  v_key_prefix text;
  v_id uuid;
begin
  select organization_id into v_org_id
  from public.integration_clients
  where id = p_integration_id;

  if v_org_id is null then
    raise exception 'INTEGRATION_NOT_FOUND';
  end if;

  if not public.has_org_role(
    v_org_id,
    array['owner', 'admin']::public.organization_role[]
  ) then
    raise exception 'FORBIDDEN';
  end if;

  if p_expires_at is not null and p_expires_at <= now() then
    raise exception 'INVALID_EXPIRY';
  end if;

  v_raw_key := 'cp_live_' || encode(gen_random_bytes(32), 'hex');
  v_key_hash := encode(digest(v_raw_key, 'sha256'), 'hex');
  v_key_prefix := left(v_raw_key, 16);

  insert into public.integration_api_keys (
    integration_id, name, key_prefix, key_hash, expires_at, created_by
  ) values (
    p_integration_id, p_name, v_key_prefix, v_key_hash, p_expires_at, auth.uid()
  ) returning id into v_id;

  insert into public.audit_logs (
    organization_id, actor_user_id, action, entity_type, entity_id,
    metadata
  ) values (
    v_org_id,
    auth.uid(),
    'integration.api_key.created',
    'integration_api_key',
    v_id::text,
    jsonb_build_object('integrationId', p_integration_id, 'prefix', v_key_prefix)
  );

  api_key_id := v_id;
  api_key := v_raw_key;
  return next;
end;
$$;

create or replace function public.revoke_integration_api_key(p_api_key_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
begin
  select ic.organization_id into v_org_id
  from public.integration_api_keys k
  join public.integration_clients ic on ic.id = k.integration_id
  where k.id = p_api_key_id;

  if v_org_id is null then
    raise exception 'API_KEY_NOT_FOUND';
  end if;

  if not public.has_org_role(
    v_org_id,
    array['owner', 'admin']::public.organization_role[]
  ) then
    raise exception 'FORBIDDEN';
  end if;

  update public.integration_api_keys
  set revoked_at = coalesce(revoked_at, now())
  where id = p_api_key_id;
end;
$$;

create or replace function public.list_integration_api_keys(p_integration_id uuid)
returns table (
  id uuid,
  name text,
  key_prefix text,
  expires_at timestamptz,
  revoked_at timestamptz,
  last_used_at timestamptz,
  created_by uuid,
  created_at timestamptz
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
begin
  select organization_id into v_org_id
  from public.integration_clients
  where integration_clients.id = p_integration_id;

  if v_org_id is null then
    raise exception 'INTEGRATION_NOT_FOUND';
  end if;

  if not public.has_org_role(
    v_org_id,
    array['owner', 'admin']::public.organization_role[]
  ) then
    raise exception 'FORBIDDEN';
  end if;

  return query
  select k.id, k.name, k.key_prefix, k.expires_at, k.revoked_at,
         k.last_used_at, k.created_by, k.created_at
  from public.integration_api_keys k
  where k.integration_id = p_integration_id
  order by k.created_at desc;
end;
$$;

create or replace function public.reorder_course_modules(
  p_course_id uuid,
  p_items jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_item jsonb;
begin
  if not public.can_manage_course(p_course_id) then
    raise exception 'FORBIDDEN';
  end if;

  if jsonb_typeof(p_items) <> 'array' then
    raise exception 'INVALID_ITEMS';
  end if;

  for v_item in select value from jsonb_array_elements(p_items)
  loop
    update public.course_modules
    set position = (v_item ->> 'position')::integer,
        updated_at = now()
    where id = (v_item ->> 'id')::uuid
      and course_id = p_course_id;

    if not found then
      raise exception 'MODULE_NOT_FOUND_OR_WRONG_COURSE';
    end if;
  end loop;
end;
$$;

create or replace function public.reorder_lessons(
  p_course_id uuid,
  p_items jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_item jsonb;
begin
  if not public.can_manage_course(p_course_id) then
    raise exception 'FORBIDDEN';
  end if;

  if jsonb_typeof(p_items) <> 'array' then
    raise exception 'INVALID_ITEMS';
  end if;

  for v_item in select value from jsonb_array_elements(p_items)
  loop
    update public.lessons
    set module_id = (v_item ->> 'moduleId')::uuid,
        position = (v_item ->> 'position')::integer,
        updated_at = now()
    where id = (v_item ->> 'id')::uuid
      and course_id = p_course_id;

    if not found then
      raise exception 'LESSON_NOT_FOUND_OR_WRONG_COURSE';
    end if;
  end loop;
end;
$$;

create or replace function public.reorder_lesson_blocks(
  p_lesson_id uuid,
  p_items jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_course_id uuid;
  v_item jsonb;
begin
  select course_id into v_course_id
  from public.lessons
  where id = p_lesson_id;

  if v_course_id is null or not public.can_manage_course(v_course_id) then
    raise exception 'FORBIDDEN';
  end if;

  if jsonb_typeof(p_items) <> 'array' then
    raise exception 'INVALID_ITEMS';
  end if;

  for v_item in select value from jsonb_array_elements(p_items)
  loop
    update public.lesson_blocks
    set position = (v_item ->> 'position')::integer,
        updated_at = now()
    where id = (v_item ->> 'id')::uuid
      and lesson_id = p_lesson_id;

    if not found then
      raise exception 'BLOCK_NOT_FOUND_OR_WRONG_LESSON';
    end if;
  end loop;
end;
$$;

create or replace function public.initialize_enrollment_totals()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_total integer;
begin
  if new.release_id is not null then
    select lesson_count into v_total
    from public.course_releases
    where id = new.release_id
      and course_id = new.course_id;
  else
    select count(*) into v_total
    from public.lessons
    where course_id = new.course_id
      and status <> 'archived';
  end if;

  new.total_lessons := coalesce(v_total, 0);
  return new;
end;
$$;

drop trigger if exists initialize_enrollment_totals on public.course_enrollments;
create trigger initialize_enrollment_totals
  before insert or update of release_id, course_id
  on public.course_enrollments
  for each row execute procedure public.initialize_enrollment_totals();

create or replace function public.recalculate_enrollment_progress()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_enrollment_id uuid;
  v_completed integer;
  v_total integer;
  v_progress numeric(5,2);
begin
  if tg_op = 'DELETE' then
    v_enrollment_id := old.enrollment_id;
  else
    v_enrollment_id := new.enrollment_id;
  end if;

  select
    count(distinct la.lesson_id) filter (where la.status = 'completed'),
    ce.total_lessons
  into v_completed, v_total
  from public.course_enrollments ce
  left join public.lesson_attempts la on la.enrollment_id = ce.id
  where ce.id = v_enrollment_id
  group by ce.total_lessons;

  if coalesce(v_total, 0) > 0 then
    v_progress := round((coalesce(v_completed, 0)::numeric / v_total::numeric) * 100, 2);
  else
    v_progress := 0;
  end if;

  update public.course_enrollments
  set completed_lessons = coalesce(v_completed, 0),
      progress_percent = coalesce(v_progress, 0),
      status = case
        when coalesce(v_total, 0) > 0 and coalesce(v_completed, 0) >= v_total
          then 'completed'::public.enrollment_status
        else status
      end,
      completed_at = case
        when coalesce(v_total, 0) > 0 and coalesce(v_completed, 0) >= v_total
          then coalesce(completed_at, now())
        else completed_at
      end,
      updated_at = now()
  where id = v_enrollment_id;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

drop trigger if exists lesson_attempts_recalculate_enrollment_insert_delete on public.lesson_attempts;
create trigger lesson_attempts_recalculate_enrollment_insert_delete
  after insert or delete
  on public.lesson_attempts
  for each row execute procedure public.recalculate_enrollment_progress();

drop trigger if exists lesson_attempts_recalculate_enrollment_update on public.lesson_attempts;
create trigger lesson_attempts_recalculate_enrollment_update
  after update of status, progress_percent
  on public.lesson_attempts
  for each row execute procedure public.recalculate_enrollment_progress();

do $$
declare
  t text;
begin
  foreach t in array array[
    'profiles', 'organizations', 'organization_members', 'courses',
    'course_modules', 'lessons', 'lesson_blocks', 'learners',
    'course_enrollments', 'lesson_attempts', 'lesson_block_progress',
    'learner_notes', 'integration_clients', 'learner_external_identities',
    'webhook_events'
  ]
  loop
    execute format('drop trigger if exists set_updated_at on public.%I', t);
    execute format(
      'create trigger set_updated_at before update on public.%I for each row execute procedure public.set_updated_at()',
      t
    );
  end loop;
end
$$;


create or replace function public.protect_organization_owner_id()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.owner_id <> old.owner_id then
    raise exception 'OWNER_TRANSFER_REQUIRES_DEDICATED_WORKFLOW';
  end if;
  return new;
end;
$$;

drop trigger if exists protect_organization_owner_id on public.organizations;
create trigger protect_organization_owner_id
  before update of owner_id
  on public.organizations
  for each row execute procedure public.protect_organization_owner_id();

create or replace function public.protect_organization_owner_membership()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner_id uuid;
begin
  if tg_op = 'DELETE' then
    select owner_id into v_owner_id
    from public.organizations
    where id = old.organization_id;
  else
    select owner_id into v_owner_id
    from public.organizations
    where id = new.organization_id;
  end if;

  if tg_op = 'DELETE' and old.user_id = v_owner_id then
    raise exception 'CANNOT_DELETE_ORGANIZATION_OWNER';
  end if;

  if tg_op in ('INSERT', 'UPDATE') then
    if new.user_id = v_owner_id and new.role <> 'owner' then
      raise exception 'ORGANIZATION_OWNER_MUST_KEEP_OWNER_ROLE';
    end if;

    if new.role = 'owner' and new.user_id <> v_owner_id then
      raise exception 'ONLY_ORGANIZATION_OWNER_CAN_HAVE_OWNER_ROLE';
    end if;
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

drop trigger if exists protect_organization_owner_membership on public.organization_members;
create trigger protect_organization_owner_membership
  before insert or update or delete
  on public.organization_members
  for each row execute procedure public.protect_organization_owner_membership();

revoke all on function public.create_organization(text, text) from public;
revoke all on function public.publish_course(uuid, text) from public;
revoke all on function public.create_integration_api_key(uuid, text, timestamptz) from public;
revoke all on function public.revoke_integration_api_key(uuid) from public;
revoke all on function public.list_integration_api_keys(uuid) from public;
revoke all on function public.reorder_course_modules(uuid, jsonb) from public;
revoke all on function public.reorder_lessons(uuid, jsonb) from public;
revoke all on function public.reorder_lesson_blocks(uuid, jsonb) from public;

grant execute on function public.create_organization(text, text) to authenticated;
grant execute on function public.publish_course(uuid, text) to authenticated;
grant execute on function public.create_integration_api_key(uuid, text, timestamptz) to authenticated;
grant execute on function public.revoke_integration_api_key(uuid) to authenticated;
grant execute on function public.list_integration_api_keys(uuid) to authenticated;
grant execute on function public.reorder_course_modules(uuid, jsonb) to authenticated;
grant execute on function public.reorder_lessons(uuid, jsonb) to authenticated;
grant execute on function public.reorder_lesson_blocks(uuid, jsonb) to authenticated;

commit;

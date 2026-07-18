begin;

insert into storage.buckets (
  id, name, public, file_size_limit, allowed_mime_types
)
values
(
  'course-covers',
  'course-covers',
  false,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
),
(
  'lesson-assets',
  'lesson-assets',
  false,
  209715200,
  array[
    'image/jpeg', 'image/png', 'image/webp', 'image/avif',
    'audio/mpeg', 'audio/mp4', 'audio/ogg', 'audio/wav',
    'video/mp4', 'video/webm', 'application/pdf'
  ]
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists course_covers_select_member on storage.objects;
create policy course_covers_select_member
on storage.objects for select to authenticated
using (
  bucket_id = 'course-covers'
  and public.is_org_member(public.storage_object_org_id(name))
);

drop policy if exists course_covers_insert_editor on storage.objects;
create policy course_covers_insert_editor
on storage.objects for insert to authenticated
with check (
  bucket_id = 'course-covers'
  and public.has_org_role(
    public.storage_object_org_id(name),
    array['owner', 'admin', 'editor']::public.organization_role[]
  )
);

drop policy if exists course_covers_update_editor on storage.objects;
create policy course_covers_update_editor
on storage.objects for update to authenticated
using (
  bucket_id = 'course-covers'
  and public.has_org_role(
    public.storage_object_org_id(name),
    array['owner', 'admin', 'editor']::public.organization_role[]
  )
)
with check (
  bucket_id = 'course-covers'
  and public.has_org_role(
    public.storage_object_org_id(name),
    array['owner', 'admin', 'editor']::public.organization_role[]
  )
);

drop policy if exists course_covers_delete_editor on storage.objects;
create policy course_covers_delete_editor
on storage.objects for delete to authenticated
using (
  bucket_id = 'course-covers'
  and public.has_org_role(
    public.storage_object_org_id(name),
    array['owner', 'admin', 'editor']::public.organization_role[]
  )
);

drop policy if exists lesson_assets_select_member on storage.objects;
create policy lesson_assets_select_member
on storage.objects for select to authenticated
using (
  bucket_id = 'lesson-assets'
  and public.is_org_member(public.storage_object_org_id(name))
);

drop policy if exists lesson_assets_insert_editor on storage.objects;
create policy lesson_assets_insert_editor
on storage.objects for insert to authenticated
with check (
  bucket_id = 'lesson-assets'
  and public.has_org_role(
    public.storage_object_org_id(name),
    array['owner', 'admin', 'editor']::public.organization_role[]
  )
);

drop policy if exists lesson_assets_update_editor on storage.objects;
create policy lesson_assets_update_editor
on storage.objects for update to authenticated
using (
  bucket_id = 'lesson-assets'
  and public.has_org_role(
    public.storage_object_org_id(name),
    array['owner', 'admin', 'editor']::public.organization_role[]
  )
)
with check (
  bucket_id = 'lesson-assets'
  and public.has_org_role(
    public.storage_object_org_id(name),
    array['owner', 'admin', 'editor']::public.organization_role[]
  )
);

drop policy if exists lesson_assets_delete_editor on storage.objects;
create policy lesson_assets_delete_editor
on storage.objects for delete to authenticated
using (
  bucket_id = 'lesson-assets'
  and public.has_org_role(
    public.storage_object_org_id(name),
    array['owner', 'admin', 'editor']::public.organization_role[]
  )
);

commit;

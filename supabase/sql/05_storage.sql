-- Optional private storage for lesson materials.
insert into storage.buckets (id, name, public, file_size_limit)
values ('lesson-assets', 'lesson-assets', false, 52428800)
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit;

create policy lesson_assets_owner_select
on storage.objects
for select
to authenticated
using (
  bucket_id = 'lesson-assets'
  and split_part(name, '/', 1) = auth.uid()::text
);

create policy lesson_assets_owner_insert
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'lesson-assets'
  and split_part(name, '/', 1) = auth.uid()::text
);

create policy lesson_assets_owner_update
on storage.objects
for update
to authenticated
using (
  bucket_id = 'lesson-assets'
  and split_part(name, '/', 1) = auth.uid()::text
)
with check (
  bucket_id = 'lesson-assets'
  and split_part(name, '/', 1) = auth.uid()::text
);

create policy lesson_assets_owner_delete
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'lesson-assets'
  and split_part(name, '/', 1) = auth.uid()::text
);

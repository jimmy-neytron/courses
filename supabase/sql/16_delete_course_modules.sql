begin;

create or replace function public.delete_course_module(
  p_course_id uuid,
  p_module_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_block_ids uuid[];
begin
  perform 1
  from public.courses
  where id = p_course_id
    and owner_id = auth.uid()
  for update;

  if not found then
    raise exception 'course_owner_required'
      using errcode = '42501';
  end if;

  perform 1
  from public.course_modules
  where id = p_module_id
    and course_id = p_course_id
  for update;

  if not found then
    raise exception 'module_not_found'
      using errcode = '22023';
  end if;

  select coalesce(array_agg(b.id), array[]::uuid[])
  into v_block_ids
  from public.lesson_blocks b
  join public.lessons l on l.id = b.lesson_id
  where l.course_id = p_course_id
    and l.module_id = p_module_id;

  perform public.enqueue_lesson_assets(v_block_ids);

  delete from public.course_modules
  where id = p_module_id
    and course_id = p_course_id;
end;
$$;

revoke all on function public.delete_course_module(uuid, uuid)
  from public;
grant execute on function public.delete_course_module(uuid, uuid)
  to authenticated;

commit;

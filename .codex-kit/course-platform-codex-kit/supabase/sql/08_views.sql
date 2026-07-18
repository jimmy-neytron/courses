begin;

create or replace view public.course_overview
with (security_invoker = true)
as
select
  c.id,
  c.organization_id,
  c.owner_id,
  c.slug,
  c.title,
  c.description,
  c.language_code,
  c.source_level,
  c.target_level,
  c.status,
  c.visibility,
  c.current_release_id,
  c.updated_at,
  count(distinct cm.id) as module_count,
  count(distinct l.id) filter (where l.status <> 'archived') as lesson_count
from public.courses c
left join public.course_modules cm on cm.course_id = c.id
left join public.lessons l on l.course_id = c.id
group by c.id;

create or replace view public.learner_course_progress
with (security_invoker = true)
as
select
  ce.id as enrollment_id,
  ce.course_id,
  c.title as course_title,
  ce.release_id,
  ce.learner_id,
  ce.status,
  ce.progress_percent,
  ce.completed_lessons,
  ce.total_lessons,
  ce.started_at,
  ce.completed_at,
  ce.updated_at
from public.course_enrollments ce
join public.courses c on c.id = ce.course_id;

create or replace view public.course_analytics_summary
with (security_invoker = true)
as
select
  c.id as course_id,
  c.organization_id,
  count(distinct ce.id) as enrollment_count,
  count(distinct ce.learner_id) filter (where ce.status = 'active') as active_learner_count,
  count(distinct ce.id) filter (where ce.status = 'completed') as completed_enrollment_count,
  coalesce(round(avg(ce.progress_percent), 2), 0) as average_progress,
  coalesce(round(avg(la.score / nullif(la.max_score, 0) * 100), 2), 0) as average_score_percent
from public.courses c
left join public.course_enrollments ce on ce.course_id = c.id
left join public.lesson_attempts la on la.enrollment_id = ce.id and la.status = 'completed'
group by c.id, c.organization_id;

grant select on public.course_overview to authenticated;
grant select on public.learner_course_progress to authenticated;
grant select on public.course_analytics_summary to authenticated;

commit;

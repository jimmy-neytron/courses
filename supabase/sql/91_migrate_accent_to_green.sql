begin;

alter table public.courses
  alter column accent_color set default '#00DC82';

update public.courses
set accent_color = '#00DC82'
where upper(accent_color) = '#F5C542';

commit;

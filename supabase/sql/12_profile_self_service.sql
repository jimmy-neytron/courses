-- Allow an authenticated user to create only their own missing profile.
-- The auth.users trigger remains the primary creation path; this policy makes
-- the application fallback in ensureProfile() safe and functional.

begin;

alter table public.profiles enable row level security;

drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own
on public.profiles for insert to authenticated
with check (id = auth.uid());

commit;

begin;

create table if not exists public.integration_api_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null
    references public.profiles(id)
    on delete cascade,
  name text not null,
  token_prefix text not null,
  token_hash text not null unique,
  scopes text[] not null default array['courses:read']::text[],
  last_used_at timestamptz,
  expires_at timestamptz,
  revoked_at timestamptz,
  rate_limit_window_started_at timestamptz,
  rate_limit_request_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint integration_api_tokens_name_not_blank
    check (length(trim(name)) between 1 and 80),
  constraint integration_api_tokens_prefix_format
    check (token_prefix ~ '^crs_[A-Za-z0-9_-]{8,24}$'),
  constraint integration_api_tokens_hash_format
    check (token_hash ~ '^[0-9a-f]{64}$'),
  constraint integration_api_tokens_scopes_supported
    check (
      cardinality(scopes) > 0
      and scopes <@ array[
        'courses:read',
        'progress:read'
      ]::text[]
    ),
  constraint integration_api_tokens_rate_nonnegative
    check (rate_limit_request_count >= 0)
);

create index if not exists integration_api_tokens_user_created_idx
  on public.integration_api_tokens(user_id, created_at desc);

create index if not exists integration_api_tokens_active_hash_idx
  on public.integration_api_tokens(token_hash)
  where revoked_at is null;

alter table public.integration_api_tokens enable row level security;

revoke all on table public.integration_api_tokens
  from anon, authenticated;

drop policy if exists integration_api_tokens_select_own
  on public.integration_api_tokens;
create policy integration_api_tokens_select_own
on public.integration_api_tokens
for select
to authenticated
using (user_id = auth.uid());

drop trigger if exists set_updated_at
  on public.integration_api_tokens;
create trigger set_updated_at
before update on public.integration_api_tokens
for each row execute procedure public.set_updated_at();

create or replace function public.verify_integration_api_token(
  p_token_hash text,
  p_required_scope text
)
returns table (
  token_id uuid,
  user_id uuid,
  scopes text[]
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_token public.integration_api_tokens%rowtype;
  v_now timestamptz := now();
  v_window interval := interval '1 minute';
  v_limit integer := 120;
begin
  select *
  into v_token
  from public.integration_api_tokens
  where token_hash = lower(trim(p_token_hash))
  for update;

  if not found
    or v_token.revoked_at is not null
    or (
      v_token.expires_at is not null
      and v_token.expires_at <= v_now
    )
  then
    raise exception 'integration_token_invalid'
      using errcode = '28000';
  end if;

  if not (
    p_required_scope = any(v_token.scopes)
  ) then
    raise exception 'integration_scope_required'
      using errcode = '42501';
  end if;

  if v_token.rate_limit_window_started_at is null
    or v_token.rate_limit_window_started_at <= v_now - v_window
  then
    v_token.rate_limit_window_started_at := v_now;
    v_token.rate_limit_request_count := 0;
  end if;

  if v_token.rate_limit_request_count >= v_limit then
    raise exception 'integration_rate_limit_exceeded'
      using errcode = 'P0001';
  end if;

  update public.integration_api_tokens
  set
    last_used_at = v_now,
    rate_limit_window_started_at =
      v_token.rate_limit_window_started_at,
    rate_limit_request_count =
      v_token.rate_limit_request_count + 1
  where id = v_token.id;

  return query
  select
    v_token.id,
    v_token.user_id,
    v_token.scopes;
end;
$$;

revoke all on function public.verify_integration_api_token(text, text)
  from public;
grant execute on function public.verify_integration_api_token(text, text)
  to service_role;

commit;

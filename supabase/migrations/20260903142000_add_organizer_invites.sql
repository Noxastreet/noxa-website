-- Website-only organizer invitations and membership claiming.
-- Invitation email ownership is verified by Supabase Auth magic-link login.

create table if not exists public.organizer_invites (
  id uuid primary key default gen_random_uuid(),
  organizer_id uuid not null references public.organizer_profiles(id) on delete cascade,
  email text not null
    check (char_length(btrim(email)) between 5 and 254),
  role text not null default 'admin'
    check (role in ('owner', 'admin', 'editor')),
  status text not null default 'pending'
    check (status in ('pending', 'revoked')),
  invited_by uuid references auth.users(id) on delete set null,
  expires_at timestamptz not null default (now() + interval '30 days'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists organizer_invites_pending_email_idx
  on public.organizer_invites (organizer_id, lower(email))
  where status = 'pending';

create index if not exists organizer_invites_email_status_idx
  on public.organizer_invites (lower(email), status, expires_at);

alter table public.organizer_invites enable row level security;

grant select, insert, update, delete on table public.organizer_invites to authenticated;
revoke all on table public.organizer_invites from anon;

create or replace function private.is_organizer_member(target_organizer_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, private
as $$
  select exists (
    select 1
    from public.organizer_admins oa
    where oa.organizer_id = target_organizer_id
      and oa.user_id = (select auth.uid())
      and oa.status = 'active'
      and oa.role in ('owner', 'admin', 'editor')
  );
$$;

revoke all on function private.is_organizer_member(uuid) from public;
grant execute on function private.is_organizer_member(uuid) to authenticated;

drop policy if exists "authenticated reads public or managed organizers" on public.organizer_profiles;
create policy "authenticated reads public or managed organizers"
  on public.organizer_profiles
  for select
  to authenticated
  using (
    (status = 'active' and verified = true)
    or private.is_radar_admin()
    or private.is_organizer_member(id)
  );

drop policy if exists "organizer admins read own memberships" on public.organizer_admins;
create policy "organizer admins read own memberships"
  on public.organizer_admins
  for select
  to authenticated
  using (user_id = (select auth.uid()) or private.is_radar_admin());

create policy "invited users claim organizer memberships"
  on public.organizer_admins
  for insert
  to authenticated
  with check (
    user_id = (select auth.uid())
    and status = 'active'
    and exists (
      select 1
      from public.organizer_invites oi
      where oi.organizer_id = organizer_admins.organizer_id
        and oi.role = organizer_admins.role
        and oi.status = 'pending'
        and oi.expires_at > now()
        and lower(oi.email) = lower(coalesce((select auth.jwt()) ->> 'email', ''))
    )
  );

create policy "users read own organizer invites"
  on public.organizer_invites
  for select
  to authenticated
  using (
    private.is_radar_admin()
    or lower(email) = lower(coalesce((select auth.jwt()) ->> 'email', ''))
  );

create policy "noxa admins insert organizer invites"
  on public.organizer_invites
  for insert
  to authenticated
  with check (private.is_radar_admin());

create policy "noxa admins update organizer invites"
  on public.organizer_invites
  for update
  to authenticated
  using (private.is_radar_admin())
  with check (private.is_radar_admin());

create policy "noxa admins delete organizer invites"
  on public.organizer_invites
  for delete
  to authenticated
  using (private.is_radar_admin());

create or replace function public.claim_organizer_invites()
returns jsonb
language plpgsql
security invoker
set search_path = public, private
as $$
declare
  invite_row record;
  claimed_count integer := 0;
  caller_email text := lower(coalesce((select auth.jwt()) ->> 'email', ''));
begin
  if (select auth.uid()) is null or caller_email = '' then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  for invite_row in
    select organizer_id, role
    from public.organizer_invites
    where status = 'pending'
      and expires_at > now()
      and lower(email) = caller_email
    order by created_at asc
  loop
    insert into public.organizer_admins (organizer_id, user_id, role, status)
    values (invite_row.organizer_id, (select auth.uid()), invite_row.role, 'active')
    on conflict (organizer_id, user_id) do nothing;

    if found then
      claimed_count := claimed_count + 1;
    end if;
  end loop;

  return jsonb_build_object('ok', true, 'claimed', claimed_count);
end;
$$;

revoke execute on function public.claim_organizer_invites() from public, anon;
grant execute on function public.claim_organizer_invites() to authenticated;

comment on table public.organizer_invites is
  'Website-only NOXA organizer invitations. A signed-in user may claim membership only when the Supabase Auth email matches an active invitation.';

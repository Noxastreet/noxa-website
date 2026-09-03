-- Website-only organizer identity and event publishing permissions.
-- The mobile app remains completely separate.

create table if not exists public.organizer_profiles (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique
    check (char_length(slug) between 2 and 80)
    check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  name text not null
    check (char_length(btrim(name)) between 2 and 120),
  organizer_type text not null
    check (organizer_type in ('community', 'team', 'company', 'page', 'group')),
  community_id uuid unique references public.communities(id) on delete cascade,
  city text
    check (city is null or char_length(city) <= 100),
  country_code text not null default 'GR'
    check (country_code ~ '^[A-Z]{2}$'),
  instagram_url text
    check (instagram_url is null or char_length(instagram_url) <= 700),
  website_url text
    check (website_url is null or char_length(website_url) <= 700),
  verified boolean not null default false,
  status text not null default 'draft'
    check (status in ('draft', 'active', 'suspended')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (organizer_type = 'community' and community_id is not null)
    or (organizer_type <> 'community' and community_id is null)
  )
);

create table if not exists public.organizer_admins (
  organizer_id uuid not null references public.organizer_profiles(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'admin'
    check (role in ('owner', 'admin', 'editor')),
  status text not null default 'active'
    check (status in ('active', 'invited', 'revoked')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (organizer_id, user_id)
);

create index if not exists organizer_profiles_type_status_idx
  on public.organizer_profiles (organizer_type, status, name);

create index if not exists organizer_admins_user_status_idx
  on public.organizer_admins (user_id, status, organizer_id);

alter table public.organizer_profiles enable row level security;
alter table public.organizer_admins enable row level security;

grant select on table public.organizer_profiles to anon, authenticated;
grant insert, update, delete on table public.organizer_profiles to authenticated;
grant select, insert, update, delete on table public.organizer_admins to authenticated;
revoke all on table public.organizer_admins from anon;

create or replace function private.is_verified_organizer_admin(target_organizer_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, private
as $$
  select exists (
    select 1
    from public.organizer_admins oa
    join public.organizer_profiles op on op.id = oa.organizer_id
    where oa.organizer_id = target_organizer_id
      and oa.user_id = auth.uid()
      and oa.status = 'active'
      and oa.role in ('owner', 'admin', 'editor')
      and op.status = 'active'
      and op.verified = true
  );
$$;

revoke all on function private.is_verified_organizer_admin(uuid) from public;
grant execute on function private.is_verified_organizer_admin(uuid) to authenticated;

create policy "anonymous reads active verified organizers"
  on public.organizer_profiles
  for select
  to anon
  using (status = 'active' and verified = true);

create policy "authenticated reads public or managed organizers"
  on public.organizer_profiles
  for select
  to authenticated
  using (
    (status = 'active' and verified = true)
    or private.is_radar_admin()
    or private.is_verified_organizer_admin(id)
  );

create policy "noxa admins insert organizers"
  on public.organizer_profiles
  for insert
  to authenticated
  with check (private.is_radar_admin());

create policy "noxa admins update organizers"
  on public.organizer_profiles
  for update
  to authenticated
  using (private.is_radar_admin())
  with check (private.is_radar_admin());

create policy "noxa admins delete organizers"
  on public.organizer_profiles
  for delete
  to authenticated
  using (private.is_radar_admin());

create policy "organizer admins read own memberships"
  on public.organizer_admins
  for select
  to authenticated
  using (user_id = auth.uid() or private.is_radar_admin());

create policy "noxa admins insert organizer memberships"
  on public.organizer_admins
  for insert
  to authenticated
  with check (private.is_radar_admin());

create policy "noxa admins update organizer memberships"
  on public.organizer_admins
  for update
  to authenticated
  using (private.is_radar_admin())
  with check (private.is_radar_admin());

create policy "noxa admins delete organizer memberships"
  on public.organizer_admins
  for delete
  to authenticated
  using (private.is_radar_admin());

alter table public.radar_events
  add column if not exists organizer_profile_id uuid references public.organizer_profiles(id) on delete set null;

alter table public.radar_events
  add column if not exists publication_source text not null default 'reviewed'
    check (publication_source in ('reviewed', 'organizer'));

create index if not exists radar_events_organizer_starts_idx
  on public.radar_events (organizer_profile_id, starts_at desc)
  where organizer_profile_id is not null;

-- Rebuild event policies so anonymous visitors can only read published events,
-- while verified organizer admins may create/update only events owned by their organizer profile.
drop policy if exists "admins manage radar events" on public.radar_events;
drop policy if exists "public reads published radar events" on public.radar_events;

drop policy if exists "anonymous reads published radar events" on public.radar_events;
drop policy if exists "authenticated reads published or managed radar events" on public.radar_events;
drop policy if exists "noxa admins insert radar events" on public.radar_events;
drop policy if exists "noxa admins update radar events" on public.radar_events;
drop policy if exists "noxa admins delete radar events" on public.radar_events;
drop policy if exists "verified organizer admins insert own events" on public.radar_events;
drop policy if exists "verified organizer admins update own events" on public.radar_events;

create policy "anonymous reads published radar events"
  on public.radar_events
  for select
  to anon
  using (status = 'published');

create policy "authenticated reads published or managed radar events"
  on public.radar_events
  for select
  to authenticated
  using (
    status = 'published'
    or private.is_radar_admin()
    or (
      organizer_profile_id is not null
      and private.is_verified_organizer_admin(organizer_profile_id)
    )
  );

create policy "noxa admins insert radar events"
  on public.radar_events
  for insert
  to authenticated
  with check (private.is_radar_admin());

create policy "noxa admins update radar events"
  on public.radar_events
  for update
  to authenticated
  using (private.is_radar_admin())
  with check (private.is_radar_admin());

create policy "noxa admins delete radar events"
  on public.radar_events
  for delete
  to authenticated
  using (private.is_radar_admin());

create policy "verified organizer admins insert own events"
  on public.radar_events
  for insert
  to authenticated
  with check (
    organizer_profile_id is not null
    and private.is_verified_organizer_admin(organizer_profile_id)
    and publication_source = 'organizer'
    and candidate_id is null
  );

create policy "verified organizer admins update own events"
  on public.radar_events
  for update
  to authenticated
  using (
    organizer_profile_id is not null
    and private.is_verified_organizer_admin(organizer_profile_id)
    and publication_source = 'organizer'
    and candidate_id is null
  )
  with check (
    organizer_profile_id is not null
    and private.is_verified_organizer_admin(organizer_profile_id)
    and publication_source = 'organizer'
    and candidate_id is null
  );

-- Anonymous users never write directly to events or the review queue.
-- Public submissions go only through the hardened Edge Function using the service role.
revoke all on table public.radar_candidates from anon;
revoke all on table public.radar_events from anon;
grant select on table public.radar_events to anon;

-- Authenticated browser clients need only row-level CRUD. RLS decides whether the caller
-- is a NOXA admin or a verified organizer admin. Remove unrelated table privileges.
revoke truncate, references, trigger on table public.radar_candidates from authenticated;
revoke truncate, references, trigger on table public.radar_events from authenticated;
grant select, insert, update, delete on table public.radar_candidates to authenticated;
grant select, insert, update, delete on table public.radar_events to authenticated;

create or replace function public.approve_community_application(
  p_application_id uuid,
  p_slug text,
  p_mark_verified boolean default false
)
returns jsonb
language plpgsql
security definer
set search_path = public, private
as $$
declare
  application_row public.community_applications%rowtype;
  new_community_id uuid;
  new_organizer_id uuid;
  normalized_slug text := lower(btrim(p_slug));
begin
  if not private.is_radar_admin() then
    raise exception 'Not authorized' using errcode = '42501';
  end if;

  if normalized_slug is null
     or char_length(normalized_slug) < 2
     or char_length(normalized_slug) > 80
     or normalized_slug !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' then
    raise exception 'Invalid community slug' using errcode = '22023';
  end if;

  select *
  into application_row
  from public.community_applications
  where id = p_application_id
  for update;

  if not found then
    raise exception 'Application not found' using errcode = 'P0002';
  end if;

  if application_row.status <> 'pending' then
    raise exception 'Application already reviewed' using errcode = '22023';
  end if;

  insert into public.communities (
    slug,
    name,
    description,
    city,
    region,
    country_code,
    focus,
    scene_tags,
    instagram_url,
    website_url,
    verified,
    status,
    published_at
  ) values (
    normalized_slug,
    application_row.community_name,
    application_row.about,
    application_row.city,
    application_row.region,
    application_row.country_code,
    application_row.focus,
    application_row.scene_tags,
    application_row.instagram_url,
    application_row.website_url,
    p_mark_verified,
    'published',
    now()
  )
  returning id into new_community_id;

  insert into public.organizer_profiles (
    slug,
    name,
    organizer_type,
    community_id,
    city,
    country_code,
    instagram_url,
    website_url,
    verified,
    status
  ) values (
    normalized_slug,
    application_row.community_name,
    'community',
    new_community_id,
    application_row.city,
    application_row.country_code,
    application_row.instagram_url,
    application_row.website_url,
    p_mark_verified,
    'active'
  )
  returning id into new_organizer_id;

  update public.community_applications
  set status = 'approved',
      reviewed_by = auth.uid(),
      reviewed_at = now(),
      updated_at = now()
  where id = p_application_id;

  return jsonb_build_object(
    'ok', true,
    'community_id', new_community_id,
    'organizer_id', new_organizer_id,
    'verified', p_mark_verified
  );
end;
$$;

revoke all on function public.approve_community_application(uuid, text, boolean) from public;
grant execute on function public.approve_community_application(uuid, text, boolean) to authenticated;

create or replace function public.reject_community_application(
  p_application_id uuid,
  p_notes text default null
)
returns boolean
language plpgsql
security definer
set search_path = public, private
as $$
begin
  if not private.is_radar_admin() then
    raise exception 'Not authorized' using errcode = '42501';
  end if;

  update public.community_applications
  set status = 'rejected',
      review_notes = nullif(left(btrim(coalesce(p_notes, '')), 1200), ''),
      reviewed_by = auth.uid(),
      reviewed_at = now(),
      updated_at = now()
  where id = p_application_id
    and status = 'pending';

  if not found then
    raise exception 'Pending application not found' using errcode = 'P0002';
  end if;

  return true;
end;
$$;

revoke all on function public.reject_community_application(uuid, text) from public;
grant execute on function public.reject_community_application(uuid, text) to authenticated;

comment on table public.organizer_profiles is
  'Website-only verified organizer identities that can represent communities, teams, companies, pages or groups.';

comment on table public.organizer_admins is
  'Authenticated website users authorized to manage a verified organizer profile. Membership is granted by NOXA, never self-assigned.';

comment on column public.radar_events.organizer_profile_id is
  'Verified organizer that owns a directly published event. Null for reviewed/imported public events.';

comment on column public.radar_events.publication_source is
  'reviewed = imported/submitted then reviewed by NOXA; organizer = directly managed by a verified organizer admin.';

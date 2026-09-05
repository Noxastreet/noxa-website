-- Website-only organizer application and moderation queue.
-- Keeps organizer onboarding separate from NOXA Communities.
-- Targets the NOXA website Supabase project only.

create table if not exists public.organizer_applications (
  id uuid primary key default gen_random_uuid(),
  organizer_name text not null check (char_length(btrim(organizer_name)) between 2 and 120),
  organizer_type text not null check (organizer_type in ('team', 'company', 'page', 'group')),
  city text not null check (char_length(btrim(city)) between 2 and 100),
  region text check (region is null or char_length(btrim(region)) <= 100),
  country_code text not null default 'GR' check (country_code ~ '^[A-Z]{2}$'),
  instagram_url text check (instagram_url is null or char_length(instagram_url) <= 700),
  website_url text check (website_url is null or char_length(website_url) <= 700),
  about text not null check (char_length(btrim(about)) between 20 and 2000),
  contact_name text not null check (char_length(btrim(contact_name)) between 2 and 120),
  contact_email text not null check (char_length(contact_email) between 5 and 254),
  consent_at timestamptz not null default now(),
  consent_version text not null default 'organizer-listing-v1' check (consent_version = 'organizer-listing-v1'),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  review_notes text check (review_notes is null or char_length(review_notes) <= 1200),
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((status = 'pending' and reviewed_at is null) or (status <> 'pending' and reviewed_at is not null))
);

create index if not exists organizer_applications_status_created_idx on public.organizer_applications (status, created_at desc);
create index if not exists organizer_applications_contact_email_idx on public.organizer_applications (lower(contact_email));
create index if not exists organizer_applications_instagram_idx on public.organizer_applications (lower(instagram_url)) where instagram_url is not null;
create index if not exists organizer_applications_website_idx on public.organizer_applications (lower(website_url)) where website_url is not null;
create index if not exists organizer_applications_reviewed_by_idx on public.organizer_applications (reviewed_by) where reviewed_by is not null;

create table if not exists public.organizer_application_rate_limits (
  fingerprint text primary key,
  window_started_at timestamptz not null,
  submission_count integer not null default 1 check (submission_count >= 0),
  updated_at timestamptz not null default now()
);

alter table public.organizer_applications enable row level security;
alter table public.organizer_application_rate_limits enable row level security;
grant select, update, delete on table public.organizer_applications to authenticated;
revoke all on table public.organizer_applications from anon;
revoke all on table public.organizer_application_rate_limits from anon, authenticated;

create policy "admins manage organizer applications" on public.organizer_applications for all to authenticated using (private.is_radar_admin()) with check (private.is_radar_admin());

create or replace function public.approve_organizer_application(p_application_id uuid,p_slug text,p_mark_verified boolean default false)
returns jsonb language plpgsql security invoker set search_path = public, private as $$
declare application_row public.organizer_applications%rowtype; new_organizer_id uuid; normalized_slug text := lower(btrim(p_slug));
begin
  if not private.is_radar_admin() then raise exception 'Not authorized' using errcode = '42501'; end if;
  if normalized_slug is null or char_length(normalized_slug) < 2 or char_length(normalized_slug) > 80 or normalized_slug !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' then raise exception 'Invalid organizer slug' using errcode = '22023'; end if;
  select * into application_row from public.organizer_applications where id = p_application_id for update;
  if not found then raise exception 'Application not found' using errcode = 'P0002'; end if;
  if application_row.status <> 'pending' then raise exception 'Application already reviewed' using errcode = '22023'; end if;
  insert into public.organizer_profiles (slug,name,organizer_type,community_id,city,country_code,instagram_url,website_url,verified,status)
  values (normalized_slug,application_row.organizer_name,application_row.organizer_type,null,application_row.city,application_row.country_code,application_row.instagram_url,application_row.website_url,p_mark_verified,'active') returning id into new_organizer_id;
  insert into public.organizer_invites (organizer_id,email,role,status,invited_by,expires_at) values (new_organizer_id,lower(application_row.contact_email),'owner','pending',auth.uid(),now()+interval '30 days');
  update public.organizer_applications set status='approved',reviewed_by=auth.uid(),reviewed_at=now(),updated_at=now() where id=p_application_id;
  return jsonb_build_object('ok',true,'organizer_id',new_organizer_id,'email',lower(application_row.contact_email),'verified',p_mark_verified);
end;$$;

create or replace function public.reject_organizer_application(p_application_id uuid,p_notes text default null)
returns boolean language plpgsql security invoker set search_path = public, private as $$
begin
  if not private.is_radar_admin() then raise exception 'Not authorized' using errcode = '42501'; end if;
  update public.organizer_applications set status='rejected',review_notes=nullif(left(btrim(coalesce(p_notes,'')),1200),''),reviewed_by=auth.uid(),reviewed_at=now(),updated_at=now() where id=p_application_id and status='pending';
  if not found then raise exception 'Pending application not found' using errcode = 'P0002'; end if;
  return true;
end;$$;

revoke execute on function public.approve_organizer_application(uuid,text,boolean) from public, anon;
revoke execute on function public.reject_organizer_application(uuid,text) from public, anon;
grant execute on function public.approve_organizer_application(uuid,text,boolean) to authenticated;
grant execute on function public.reject_organizer_application(uuid,text) to authenticated;
comment on table public.organizer_applications is 'Private website-only applications from teams, companies, pages and groups requesting a NOXA Organizer identity.';
comment on table public.organizer_application_rate_limits is 'Internal hashed rate-limit state for public organizer applications. No raw client identifiers are stored.';

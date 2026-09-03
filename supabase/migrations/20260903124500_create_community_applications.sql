-- Website-only community application and moderation queue.
-- Targets the NOXA website / NOXA Meets Supabase project only.

create table if not exists public.community_applications (
  id uuid primary key default gen_random_uuid(),
  community_name text not null
    check (char_length(btrim(community_name)) between 2 and 120),
  city text not null
    check (char_length(btrim(city)) between 2 and 100),
  region text
    check (region is null or char_length(btrim(region)) <= 100),
  country_code text not null default 'GR'
    check (country_code ~ '^[A-Z]{2}$'),
  focus text not null default 'mixed'
    check (focus in ('car', 'moto', 'mixed')),
  scene_tags text[] not null default '{}'::text[]
    check (cardinality(scene_tags) <= 16),
  instagram_url text
    check (instagram_url is null or char_length(instagram_url) <= 700),
  website_url text
    check (website_url is null or char_length(website_url) <= 700),
  about text not null
    check (char_length(btrim(about)) between 20 and 2000),
  contact_name text not null
    check (char_length(btrim(contact_name)) between 2 and 120),
  contact_email text not null
    check (char_length(contact_email) between 5 and 254),
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  review_notes text
    check (review_notes is null or char_length(review_notes) <= 1200),
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((status = 'pending' and reviewed_at is null) or status <> 'pending')
);

create index if not exists community_applications_status_created_idx
  on public.community_applications (status, created_at desc);

create index if not exists community_applications_contact_email_idx
  on public.community_applications (lower(contact_email));

create index if not exists community_applications_instagram_idx
  on public.community_applications (lower(instagram_url))
  where instagram_url is not null;

create table if not exists public.community_application_rate_limits (
  fingerprint text primary key,
  window_started_at timestamptz not null,
  submission_count integer not null default 1
    check (submission_count >= 0),
  updated_at timestamptz not null default now()
);

alter table public.community_applications enable row level security;
alter table public.community_application_rate_limits enable row level security;

-- Applications contain private contact details. They are never readable by anonymous users.
grant select, update, delete on table public.community_applications to authenticated;
revoke all on table public.community_applications from anon;
revoke all on table public.community_application_rate_limits from anon, authenticated;

create policy "admins manage community applications"
  on public.community_applications
  for all
  to authenticated
  using (private.is_radar_admin())
  with check (private.is_radar_admin());

comment on table public.community_applications is
  'Private website-only applications from automotive and motorcycle communities requesting a NOXA Community profile.';

comment on table public.community_application_rate_limits is
  'Internal hashed submission rate-limit state for the public community application form. No raw client identifiers are stored.';

-- Website-only NOXA Communities foundation.
-- This migration targets the website/NOXA Meets Supabase project, not the mobile app database.

create table if not exists public.communities (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique
    check (char_length(slug) between 2 and 80)
    check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  name text not null
    check (char_length(btrim(name)) between 2 and 100),
  description text
    check (description is null or char_length(description) <= 1800),
  city text
    check (city is null or char_length(city) <= 100),
  region text
    check (region is null or char_length(region) <= 100),
  country_code text not null default 'GR'
    check (country_code ~ '^[A-Z]{2}$'),
  focus text not null default 'mixed'
    check (focus in ('car', 'moto', 'mixed')),
  scene_tags text[] not null default '{}'::text[]
    check (cardinality(scene_tags) <= 16),
  logo_url text
    check (logo_url is null or char_length(logo_url) <= 700),
  cover_image_url text
    check (cover_image_url is null or char_length(cover_image_url) <= 700),
  instagram_url text
    check (instagram_url is null or char_length(instagram_url) <= 700),
  website_url text
    check (website_url is null or char_length(website_url) <= 700),
  verified boolean not null default false,
  status text not null default 'draft'
    check (status in ('draft', 'published', 'archived')),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((status = 'published' and published_at is not null) or status <> 'published')
);

create index if not exists communities_public_country_city_idx
  on public.communities (country_code, city, name)
  where status = 'published';

create index if not exists communities_public_focus_idx
  on public.communities (focus, name)
  where status = 'published';

alter table public.radar_events
  add column if not exists community_id uuid references public.communities(id) on delete set null;

create index if not exists radar_events_community_starts_at_idx
  on public.radar_events (community_id, starts_at desc)
  where community_id is not null;

alter table public.communities enable row level security;

grant select on table public.communities to anon, authenticated;
grant insert, update, delete on table public.communities to authenticated;

create policy "public reads published communities"
  on public.communities
  for select
  to anon, authenticated
  using (status = 'published');

create policy "admins manage communities"
  on public.communities
  for all
  to authenticated
  using (private.is_radar_admin())
  with check (private.is_radar_admin());

comment on table public.communities is
  'Website-only public automotive and motorcycle communities. Separate from mobile-app Crews until future synchronization.';

comment on column public.radar_events.community_id is
  'Optional link from a NOXA Meets event to a website Community profile.';

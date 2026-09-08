-- TICKET 3: verified content pipeline for tracks, routes, off-road locations and photo spots.
-- Public map features stay separate from private candidates. A candidate must pass source,
-- geometry and access checks before it can become verified, and only a verified candidate
-- can be promoted into the public automotive_map_features table.

create table if not exists public.automotive_map_sources (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) > 0),
  source_type text not null check (
    source_type in (
      'official_venue', 'government', 'tourism_authority', 'federation',
      'organizer', 'club', 'osm', 'reliable_media', 'community'
    )
  ),
  base_url text not null check (base_url ~* '^https?://[^[:space:]]+$'),
  country_code text not null default 'GR' check (country_code ~ '^[A-Z]{2}$'),
  trust_level text not null check (trust_level in ('high', 'medium', 'low')),
  active boolean not null default true,
  notes text,
  verified_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists automotive_map_sources_base_url_idx
  on public.automotive_map_sources (base_url);
create index if not exists automotive_map_sources_active_trust_idx
  on public.automotive_map_sources (active, trust_level, country_code);

alter table public.automotive_map_sources enable row level security;
revoke all on public.automotive_map_sources from anon, authenticated;

create or replace function private.touch_automotive_map_source_updated_at()
returns trigger
language plpgsql
set search_path = public, private
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists automotive_map_source_touch_updated_at on public.automotive_map_sources;
create trigger automotive_map_source_touch_updated_at
before update on public.automotive_map_sources
for each row execute function private.touch_automotive_map_source_updated_at();

alter table public.automotive_map_features
  add column if not exists source_id uuid references public.automotive_map_sources(id) on delete restrict,
  add column if not exists feature_subtype text,
  add column if not exists public_access_status text not null default 'unknown',
  add column if not exists driving_access_status text not null default 'unknown',
  add column if not exists access_notes text,
  add column if not exists access_source_url text,
  add column if not exists access_verified_at timestamptz;

alter table public.automotive_map_features
  drop constraint if exists automotive_map_feature_public_access_status_check,
  add constraint automotive_map_feature_public_access_status_check
    check (public_access_status in ('confirmed', 'conditional', 'restricted', 'unknown')),
  drop constraint if exists automotive_map_feature_driving_access_status_check,
  add constraint automotive_map_feature_driving_access_status_check
    check (driving_access_status in ('confirmed', 'conditional', 'restricted', 'unknown', 'not_applicable')),
  drop constraint if exists automotive_map_feature_subtype_check,
  add constraint automotive_map_feature_subtype_check
    check (
      feature_subtype is null
      or (feature_type = 'track' and feature_subtype in (
        'race_circuit', 'kart_track', 'motocross_track', 'offroad_park',
        'driving_center', 'drag_strip', 'other_track'
      ))
      or (feature_type = 'route' and feature_subtype in (
        'scenic_route', 'mountain_road', 'touring_route', 'offroad_route', 'other_route'
      ))
      or (feature_type = 'automotive_place' and feature_subtype in (
        'photo_spot', 'viewpoint', 'automotive_museum', 'meeting_venue',
        'garage', 'tuning_shop', 'club', 'other_place'
      ))
    );

create index if not exists automotive_map_features_source_idx
  on public.automotive_map_features (source_id, status);
create index if not exists automotive_map_features_subtype_idx
  on public.automotive_map_features (feature_type, feature_subtype, status);

comment on column public.automotive_map_features.public_access_status is
  'Whether public access is confirmed by the cited source. This is not a legal opinion.';
comment on column public.automotive_map_features.driving_access_status is
  'Whether ordinary vehicle access/use is confirmed by the cited source. This never implies permission for racing, drifting or speeding.';

create table if not exists public.automotive_map_candidates (
  id uuid primary key default gen_random_uuid(),
  external_key text not null unique check (external_key ~ '^[a-z0-9][a-z0-9-]{2,119}$'),
  status text not null default 'new' check (status in ('new', 'verified', 'blocked', 'published')),
  feature_type text not null check (feature_type in ('track', 'route', 'automotive_place')),
  feature_subtype text,
  title text not null check (char_length(btrim(title)) > 0),
  title_el text,
  summary text,
  summary_el text,
  country_code text not null default 'GR' check (country_code ~ '^[A-Z]{2}$'),
  city text,
  region text,
  location_text text,
  location_text_el text,
  latitude double precision,
  longitude double precision,
  geometry_geojson jsonb,
  bbox_min_lat double precision,
  bbox_min_lng double precision,
  bbox_max_lat double precision,
  bbox_max_lng double precision,
  source_id uuid references public.automotive_map_sources(id) on delete restrict,
  source_url text not null,
  public_access_status text not null default 'unknown',
  driving_access_status text not null default 'unknown',
  access_notes text,
  access_source_url text,
  access_verified_at timestamptz,
  cover_image_url text,
  cover_image_source_url text,
  tags text[] not null default '{}',
  block_reason text,
  verified_at timestamptz,
  published_feature_id uuid references public.automotive_map_features(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint automotive_map_candidate_point_check check (
    (latitude is null and longitude is null)
    or (latitude between -90 and 90 and longitude between -180 and 180)
  ),
  constraint automotive_map_candidate_point_pair_check check ((latitude is null) = (longitude is null)),
  constraint automotive_map_candidate_bbox_check check (
    (bbox_min_lat is null and bbox_min_lng is null and bbox_max_lat is null and bbox_max_lng is null)
    or (
      bbox_min_lat is not null and bbox_min_lng is not null
      and bbox_max_lat is not null and bbox_max_lng is not null
      and bbox_min_lat between -90 and 90 and bbox_max_lat between -90 and 90
      and bbox_min_lng between -180 and 180 and bbox_max_lng between -180 and 180
      and bbox_min_lat <= bbox_max_lat and bbox_min_lng <= bbox_max_lng
    )
  ),
  constraint automotive_map_candidate_public_access_check
    check (public_access_status in ('confirmed', 'conditional', 'restricted', 'unknown')),
  constraint automotive_map_candidate_driving_access_check
    check (driving_access_status in ('confirmed', 'conditional', 'restricted', 'unknown', 'not_applicable')),
  constraint automotive_map_candidate_subtype_check check (
    feature_subtype is null
    or (feature_type = 'track' and feature_subtype in (
      'race_circuit', 'kart_track', 'motocross_track', 'offroad_park',
      'driving_center', 'drag_strip', 'other_track'
    ))
    or (feature_type = 'route' and feature_subtype in (
      'scenic_route', 'mountain_road', 'touring_route', 'offroad_route', 'other_route'
    ))
    or (feature_type = 'automotive_place' and feature_subtype in (
      'photo_spot', 'viewpoint', 'automotive_museum', 'meeting_venue',
      'garage', 'tuning_shop', 'club', 'other_place'
    ))
  )
);

create index if not exists automotive_map_candidates_status_idx
  on public.automotive_map_candidates (status, feature_type, country_code);
create index if not exists automotive_map_candidates_source_idx
  on public.automotive_map_candidates (source_id, status);

alter table public.automotive_map_candidates enable row level security;
revoke all on public.automotive_map_candidates from anon, authenticated;

create or replace function private.touch_automotive_map_candidate_updated_at()
returns trigger
language plpgsql
set search_path = public, private
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists automotive_map_candidate_touch_updated_at on public.automotive_map_candidates;
create trigger automotive_map_candidate_touch_updated_at
before update on public.automotive_map_candidates
for each row execute function private.touch_automotive_map_candidate_updated_at();

create or replace function private.automotive_map_candidate_quality_issues(
  target public.automotive_map_candidates
)
returns text[]
language plpgsql
stable
set search_path = public, private
as $$
declare
  issues text[] := array[]::text[];
  source_trust text;
  source_active boolean;
begin
  if target.source_url !~* '^https?://[^[:space:]]+$' then
    issues := array_append(issues, 'invalid_source_url');
  end if;
  if target.verified_at is null then
    issues := array_append(issues, 'unverified_candidate');
  end if;
  if target.source_id is null then
    issues := array_append(issues, 'missing_source_registry');
  else
    select s.trust_level, s.active into source_trust, source_active
    from public.automotive_map_sources s where s.id = target.source_id;
    if not found then
      issues := array_append(issues, 'unknown_source_registry');
    else
      if not source_active then issues := array_append(issues, 'inactive_source_registry'); end if;
      if source_trust = 'low' then issues := array_append(issues, 'low_trust_source'); end if;
    end if;
  end if;
  if coalesce(btrim(target.feature_subtype), '') = '' then
    issues := array_append(issues, 'missing_feature_subtype');
  end if;
  if target.feature_type = 'route' then
    if target.geometry_geojson is null then
      issues := array_append(issues, 'missing_route_geometry');
    elsif jsonb_typeof(target.geometry_geojson) <> 'object'
      or coalesce(target.geometry_geojson ->> 'type', '') not in ('LineString', 'MultiLineString') then
      issues := array_append(issues, 'invalid_route_geometry');
    end if;
    if target.bbox_min_lat is null or target.bbox_min_lng is null
      or target.bbox_max_lat is null or target.bbox_max_lng is null then
      issues := array_append(issues, 'missing_route_bbox');
    end if;
  elsif target.latitude is null or target.longitude is null then
    if target.geometry_geojson is null
      or target.bbox_min_lat is null or target.bbox_min_lng is null
      or target.bbox_max_lat is null or target.bbox_max_lng is null then
      issues := array_append(issues, 'missing_map_geometry');
    end if;
  end if;
  if target.public_access_status in ('unknown', 'restricted') then
    issues := array_append(issues, 'public_access_not_verified');
  end if;
  if target.feature_type in ('track', 'route')
    and target.driving_access_status in ('unknown', 'restricted', 'not_applicable') then
    issues := array_append(issues, 'driving_access_not_verified');
  elsif target.feature_type = 'automotive_place'
    and target.driving_access_status in ('unknown', 'restricted') then
    issues := array_append(issues, 'driving_access_not_verified');
  end if;
  if target.access_verified_at is null then
    issues := array_append(issues, 'access_not_verified');
  end if;
  if coalesce(target.access_source_url, '') !~* '^https?://[^[:space:]]+$' then
    issues := array_append(issues, 'invalid_access_source_url');
  end if;
  if target.feature_subtype in ('offroad_route', 'photo_spot', 'viewpoint')
    and coalesce(source_trust, 'low') <> 'high' then
    issues := array_append(issues, 'high_trust_source_required');
  end if;
  return issues;
end;
$$;

revoke all on function private.automotive_map_candidate_quality_issues(public.automotive_map_candidates) from public;

create or replace function private.enforce_automotive_map_candidate_quality()
returns trigger
language plpgsql
set search_path = public, private
as $$
declare
  issues text[];
begin
  if new.status in ('verified', 'published') then
    issues := private.automotive_map_candidate_quality_issues(new);
    if cardinality(issues) > 0 then
      raise exception 'AUTOMOTIVE_MAP_CANDIDATE_QUALITY_GATE:%', array_to_string(issues, ',')
        using errcode = '23514';
    end if;
  end if;
  if new.status = 'blocked' and coalesce(btrim(new.block_reason), '') = '' then
    raise exception 'AUTOMOTIVE_MAP_CANDIDATE_BLOCK_REASON_REQUIRED' using errcode = '23514';
  end if;
  return new;
end;
$$;

drop trigger if exists automotive_map_candidate_quality_gate on public.automotive_map_candidates;
create trigger automotive_map_candidate_quality_gate
before insert or update on public.automotive_map_candidates
for each row execute function private.enforce_automotive_map_candidate_quality();

create or replace function private.automotive_map_feature_quality_issues(
  target public.automotive_map_features
)
returns text[]
language plpgsql
stable
set search_path = public, private
as $$
declare
  issues text[] := array[]::text[];
  source_trust text;
  source_active boolean;
begin
  if coalesce(btrim(target.title), '') = '' then issues := array_append(issues, 'missing_title'); end if;
  if coalesce(btrim(target.source_name), '') = '' then issues := array_append(issues, 'missing_source_name'); end if;
  if target.country_code !~ '^[A-Z]{2}$' then issues := array_append(issues, 'invalid_country'); end if;
  if target.source_url !~* '^https?://[^[:space:]]+$' then issues := array_append(issues, 'invalid_source_url'); end if;
  if target.verified_at is null then issues := array_append(issues, 'unverified_source'); end if;
  if target.source_id is null then
    issues := array_append(issues, 'missing_source_registry');
  else
    select s.trust_level, s.active into source_trust, source_active
    from public.automotive_map_sources s where s.id = target.source_id;
    if not found then
      issues := array_append(issues, 'unknown_source_registry');
    else
      if not source_active then issues := array_append(issues, 'inactive_source_registry'); end if;
      if source_trust = 'low' then issues := array_append(issues, 'low_trust_source'); end if;
    end if;
  end if;
  if coalesce(btrim(target.feature_subtype), '') = '' then issues := array_append(issues, 'missing_feature_subtype'); end if;
  if target.geometry_geojson is not null and jsonb_typeof(target.geometry_geojson) <> 'object' then
    issues := array_append(issues, 'invalid_geojson');
  end if;
  if target.feature_type = 'route' then
    if target.geometry_geojson is null then
      issues := array_append(issues, 'missing_route_geometry');
    elsif coalesce(target.geometry_geojson ->> 'type', '') not in ('LineString', 'MultiLineString') then
      issues := array_append(issues, 'invalid_route_geometry');
    end if;
    if target.bbox_min_lat is null or target.bbox_min_lng is null
      or target.bbox_max_lat is null or target.bbox_max_lng is null then
      issues := array_append(issues, 'missing_route_bbox');
    end if;
  elsif target.latitude is null or target.longitude is null then
    if target.geometry_geojson is null
      or target.bbox_min_lat is null or target.bbox_min_lng is null
      or target.bbox_max_lat is null or target.bbox_max_lng is null then
      issues := array_append(issues, 'missing_map_geometry');
    end if;
  end if;
  if target.public_access_status in ('unknown', 'restricted') then issues := array_append(issues, 'public_access_not_verified'); end if;
  if target.feature_type in ('track', 'route')
    and target.driving_access_status in ('unknown', 'restricted', 'not_applicable') then
    issues := array_append(issues, 'driving_access_not_verified');
  elsif target.feature_type = 'automotive_place'
    and target.driving_access_status in ('unknown', 'restricted') then
    issues := array_append(issues, 'driving_access_not_verified');
  end if;
  if target.access_verified_at is null then issues := array_append(issues, 'access_not_verified'); end if;
  if coalesce(target.access_source_url, target.source_url, '') !~* '^https?://[^[:space:]]+$' then
    issues := array_append(issues, 'invalid_access_source_url');
  end if;
  if target.feature_subtype in ('offroad_route', 'photo_spot', 'viewpoint')
    and coalesce(source_trust, 'low') <> 'high' then
    issues := array_append(issues, 'high_trust_source_required');
  end if;
  return issues;
end;
$$;

revoke all on function private.automotive_map_feature_quality_issues(public.automotive_map_features) from public;

create or replace function private.publish_automotive_map_candidate(p_candidate_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public, private
as $$
declare
  candidate public.automotive_map_candidates%rowtype;
  source_record public.automotive_map_sources%rowtype;
  new_feature_id uuid;
begin
  select * into candidate from public.automotive_map_candidates where id = p_candidate_id for update;
  if not found then raise exception 'AUTOMOTIVE_MAP_CANDIDATE_NOT_FOUND' using errcode = 'P0002'; end if;
  if candidate.status <> 'verified' then raise exception 'AUTOMOTIVE_MAP_CANDIDATE_NOT_VERIFIED' using errcode = '23514'; end if;
  if candidate.published_feature_id is not null then return candidate.published_feature_id; end if;

  select * into source_record from public.automotive_map_sources where id = candidate.source_id;
  if not found then raise exception 'AUTOMOTIVE_MAP_SOURCE_NOT_FOUND' using errcode = 'P0002'; end if;

  insert into public.automotive_map_features (
    feature_type, status, title, title_el, summary, summary_el, country_code, city, region,
    location_text, location_text_el, latitude, longitude, geometry_geojson,
    bbox_min_lat, bbox_min_lng, bbox_max_lat, bbox_max_lng,
    source_name, source_url, verified_at, cover_image_url, cover_image_source_url, tags,
    source_id, feature_subtype, public_access_status, driving_access_status,
    access_notes, access_source_url, access_verified_at
  ) values (
    candidate.feature_type, 'published', candidate.title, candidate.title_el, candidate.summary, candidate.summary_el,
    candidate.country_code, candidate.city, candidate.region, candidate.location_text, candidate.location_text_el,
    candidate.latitude, candidate.longitude, candidate.geometry_geojson,
    candidate.bbox_min_lat, candidate.bbox_min_lng, candidate.bbox_max_lat, candidate.bbox_max_lng,
    source_record.name, candidate.source_url, candidate.verified_at,
    candidate.cover_image_url, candidate.cover_image_source_url, candidate.tags,
    candidate.source_id, candidate.feature_subtype, candidate.public_access_status, candidate.driving_access_status,
    candidate.access_notes, candidate.access_source_url, candidate.access_verified_at
  ) returning id into new_feature_id;

  update public.automotive_map_candidates
  set status = 'published', published_feature_id = new_feature_id
  where id = candidate.id;

  return new_feature_id;
end;
$$;

revoke all on function private.publish_automotive_map_candidate(uuid) from public;
grant execute on function private.publish_automotive_map_candidate(uuid) to service_role;

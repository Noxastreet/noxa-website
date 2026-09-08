-- TICKET 2A: scalable data foundation for the NOXA Automotive Map.
-- No map rendering engine is introduced here. This migration provides verified map features
-- and one viewport-bounded RPC that merges published Radar events with map content.

create table if not exists public.automotive_map_features (
  id uuid primary key default gen_random_uuid(),
  feature_type text not null check (feature_type in ('track', 'route', 'automotive_place')),
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
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
  source_name text not null,
  source_url text not null,
  verified_at timestamptz,
  cover_image_url text,
  cover_image_source_url text,
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint automotive_map_feature_point_check check (
    (latitude is null and longitude is null)
    or (
      latitude between -90 and 90
      and longitude between -180 and 180
    )
  ),
  constraint automotive_map_feature_point_pair_check check (
    (latitude is null) = (longitude is null)
  ),
  constraint automotive_map_feature_bbox_check check (
    (
      bbox_min_lat is null and bbox_min_lng is null
      and bbox_max_lat is null and bbox_max_lng is null
    )
    or (
      bbox_min_lat is not null and bbox_min_lng is not null
      and bbox_max_lat is not null and bbox_max_lng is not null
      and bbox_min_lat between -90 and 90
      and bbox_max_lat between -90 and 90
      and bbox_min_lng between -180 and 180
      and bbox_max_lng between -180 and 180
      and bbox_min_lat <= bbox_max_lat
      and bbox_min_lng <= bbox_max_lng
    )
  )
);

create index if not exists automotive_map_features_status_type_idx
  on public.automotive_map_features (status, feature_type);
create index if not exists automotive_map_features_country_idx
  on public.automotive_map_features (country_code, status);
create index if not exists automotive_map_features_point_idx
  on public.automotive_map_features (latitude, longitude)
  where status = 'published' and latitude is not null and longitude is not null;
create index if not exists automotive_map_features_bbox_idx
  on public.automotive_map_features (bbox_min_lat, bbox_max_lat, bbox_min_lng, bbox_max_lng)
  where status = 'published' and bbox_min_lat is not null;

alter table public.automotive_map_features enable row level security;

drop policy if exists "public can read published automotive map features"
  on public.automotive_map_features;
create policy "public can read published automotive map features"
  on public.automotive_map_features
  for select
  to anon, authenticated
  using (status = 'published');

grant select on public.automotive_map_features to anon, authenticated;
revoke insert, update, delete on public.automotive_map_features from anon, authenticated;

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
begin
  if coalesce(btrim(target.title), '') = '' then
    issues := array_append(issues, 'missing_title');
  end if;

  if coalesce(btrim(target.source_name), '') = '' then
    issues := array_append(issues, 'missing_source_name');
  end if;

  if target.country_code !~ '^[A-Z]{2}$' then
    issues := array_append(issues, 'invalid_country');
  end if;

  if target.source_url !~* '^https?://[^[:space:]]+$' then
    issues := array_append(issues, 'invalid_source_url');
  end if;

  if target.verified_at is null then
    issues := array_append(issues, 'unverified_source');
  end if;

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

  return issues;
end;
$$;

revoke all on function private.automotive_map_feature_quality_issues(public.automotive_map_features) from public;

create or replace function private.enforce_automotive_map_feature_quality()
returns trigger
language plpgsql
set search_path = public, private
as $$
declare
  issues text[];
begin
  if new.status = 'published' then
    issues := private.automotive_map_feature_quality_issues(new);
    if cardinality(issues) > 0 then
      raise exception 'AUTOMOTIVE_MAP_QUALITY_GATE:%', array_to_string(issues, ',')
        using errcode = '23514';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists automotive_map_feature_quality_gate on public.automotive_map_features;
create trigger automotive_map_feature_quality_gate
before insert or update on public.automotive_map_features
for each row
execute function private.enforce_automotive_map_feature_quality();

create or replace function private.touch_automotive_map_feature_updated_at()
returns trigger
language plpgsql
set search_path = public, private
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists automotive_map_feature_touch_updated_at on public.automotive_map_features;
create trigger automotive_map_feature_touch_updated_at
before update on public.automotive_map_features
for each row
execute function private.touch_automotive_map_feature_updated_at();

create or replace function public.automotive_map_features_in_view(
  p_min_lng double precision,
  p_min_lat double precision,
  p_max_lng double precision,
  p_max_lat double precision,
  p_layers text[] default array['events', 'tracks', 'routes', 'places']::text[],
  p_limit integer default 250
)
returns table (
  feature_id uuid,
  layer text,
  feature_kind text,
  title text,
  title_el text,
  feature_type text,
  latitude double precision,
  longitude double precision,
  geometry_geojson jsonb,
  bbox_min_lat double precision,
  bbox_min_lng double precision,
  bbox_max_lat double precision,
  bbox_max_lng double precision,
  country_code text,
  city text,
  region text,
  location_text text,
  location_text_el text,
  cover_image_url text,
  href text,
  starts_at timestamptz,
  ends_at timestamptz,
  source_url text
)
language plpgsql
stable
security invoker
set search_path = public, private
as $$
begin
  if p_min_lng is null or p_min_lat is null or p_max_lng is null or p_max_lat is null
    or p_min_lng < -180 or p_max_lng > 180
    or p_min_lat < -90 or p_max_lat > 90
    or p_min_lng >= p_max_lng or p_min_lat >= p_max_lat then
    raise exception 'INVALID_MAP_BBOX' using errcode = '22023';
  end if;

  if p_max_lng - p_min_lng > 40 or p_max_lat - p_min_lat > 25 then
    raise exception 'MAP_BBOX_TOO_LARGE' using errcode = '22023';
  end if;

  return query
  select merged.*
  from (
    select
      e.id as feature_id,
      'events'::text as layer,
      'event'::text as feature_kind,
      e.title,
      e.title_el,
      e.event_type::text as feature_type,
      e.latitude,
      e.longitude,
      null::jsonb as geometry_geojson,
      e.latitude as bbox_min_lat,
      e.longitude as bbox_min_lng,
      e.latitude as bbox_max_lat,
      e.longitude as bbox_max_lng,
      e.country_code,
      e.city,
      e.region,
      e.location_text,
      e.location_text_el,
      e.cover_image_url,
      ('/meets/' || e.public_slug)::text as href,
      e.starts_at,
      e.ends_at,
      e.source_url
    from public.radar_events e
    where array_position(p_layers, 'events') is not null
      and e.status = 'published'
      and e.location_precision = 'exact'
      and e.latitude is not null and e.longitude is not null
      and e.latitude between p_min_lat and p_max_lat
      and e.longitude between p_min_lng and p_max_lng
      and coalesce(e.ends_at, e.starts_at) >= now()

    union all

    select
      f.id as feature_id,
      case f.feature_type
        when 'track' then 'tracks'
        when 'route' then 'routes'
        else 'places'
      end::text as layer,
      'map_feature'::text as feature_kind,
      f.title,
      f.title_el,
      f.feature_type,
      f.latitude,
      f.longitude,
      f.geometry_geojson,
      f.bbox_min_lat,
      f.bbox_min_lng,
      f.bbox_max_lat,
      f.bbox_max_lng,
      f.country_code,
      f.city,
      f.region,
      f.location_text,
      f.location_text_el,
      f.cover_image_url,
      null::text as href,
      null::timestamptz as starts_at,
      null::timestamptz as ends_at,
      f.source_url
    from public.automotive_map_features f
    where f.status = 'published'
      and array_position(
        p_layers,
        case f.feature_type
          when 'track' then 'tracks'
          when 'route' then 'routes'
          else 'places'
        end
      ) is not null
      and (
        (
          f.latitude is not null and f.longitude is not null
          and f.latitude between p_min_lat and p_max_lat
          and f.longitude between p_min_lng and p_max_lng
        )
        or (
          f.bbox_min_lat is not null and f.bbox_min_lng is not null
          and f.bbox_max_lat is not null and f.bbox_max_lng is not null
          and f.bbox_max_lat >= p_min_lat
          and f.bbox_min_lat <= p_max_lat
          and f.bbox_max_lng >= p_min_lng
          and f.bbox_min_lng <= p_max_lng
        )
      )
  ) merged
  limit greatest(1, least(coalesce(p_limit, 250), 500));
end;
$$;

revoke all on function public.automotive_map_features_in_view(
  double precision, double precision, double precision, double precision, text[], integer
) from public;
grant execute on function public.automotive_map_features_in_view(
  double precision, double precision, double precision, double precision, text[], integer
) to anon, authenticated;

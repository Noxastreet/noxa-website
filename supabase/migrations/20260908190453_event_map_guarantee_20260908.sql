-- P0 Event Map Guarantee: every newly published event must be map-eligible.
-- Existing published events are intentionally not backfilled or rewritten.
-- The invariant is enforced at candidate approval/publication time and on map-location edits.

create or replace function private.radar_candidate_quality_issues(target public.radar_candidates)
returns text[]
language plpgsql
stable
set search_path = public, private
as $$
declare
  issues text[] := array[]::text[];
  organizer_key text := lower(regexp_replace(coalesce(btrim(target.organizer_name), ''), '[^[:alnum:]]+', '', 'g'));
  summary_text text := lower(coalesce(btrim(target.summary), ''));
begin
  if coalesce(btrim(target.title), '') = '' then
    issues := array_append(issues, 'missing_title');
  elsif lower(btrim(target.title)) in ('tbd', 'to be announced', 'untitled', 'event reminder', 'coming soon') then
    issues := array_append(issues, 'placeholder_title');
  end if;

  if target.starts_at is null then
    issues := array_append(issues, 'missing_start');
  end if;

  if target.ends_at is not null and target.starts_at is not null and target.ends_at <= target.starts_at then
    issues := array_append(issues, 'invalid_end');
  end if;

  if coalesce(btrim(target.timezone), '') = '' then
    issues := array_append(issues, 'missing_timezone');
  end if;

  if coalesce(btrim(target.city), '') = '' and coalesce(btrim(target.location_text), '') = '' then
    issues := array_append(issues, 'missing_location');
  end if;

  if coalesce(btrim(target.organizer_name), '') = '' then
    issues := array_append(issues, 'missing_organizer');
  elsif organizer_key in ('noxaradar', 'omae', 'amotoe', 'αμοτοε') then
    issues := array_append(issues, 'source_as_organizer');
  end if;

  if coalesce(btrim(target.summary), '') = '' then
    issues := array_append(issues, 'missing_summary');
  elsif summary_text = 'this is an event reminder'
     or summary_text like '%review the original source before publishing%'
     or summary_text like 'official omae event announcement%'
     or summary_text like 'official α.μοτ.ο.ε. announcement%'
     or summary_text like 'official amotoe announcement%' then
    issues := array_append(issues, 'placeholder_summary');
  elsif char_length(btrim(target.summary)) < 32 then
    issues := array_append(issues, 'short_summary');
  end if;

  if target.original_url !~* '^https?://[^[:space:]]+$' then
    issues := array_append(issues, 'invalid_source_url');
  end if;

  if target.country_code !~ '^[A-Z]{2}$' then
    issues := array_append(issues, 'invalid_country');
  end if;

  if coalesce(target.location_precision, 'unknown') <> 'exact' then
    issues := array_append(issues, 'map_location_not_exact');
  end if;

  if target.latitude is null or target.longitude is null then
    issues := array_append(issues, 'map_coordinates_missing');
  end if;

  return issues;
end;
$$;

create or replace function private.radar_event_quality_issues(target public.radar_events)
returns text[]
language plpgsql
stable
set search_path = public, private
as $$
declare
  issues text[] := array[]::text[];
  organizer_key text := lower(regexp_replace(coalesce(btrim(target.organizer_name), ''), '[^[:alnum:]]+', '', 'g'));
  summary_text text := lower(coalesce(btrim(target.summary), ''));
begin
  if coalesce(btrim(target.title), '') = '' then
    issues := array_append(issues, 'missing_title');
  elsif lower(btrim(target.title)) in ('tbd', 'to be announced', 'untitled', 'event reminder', 'coming soon') then
    issues := array_append(issues, 'placeholder_title');
  end if;

  if target.starts_at is null then
    issues := array_append(issues, 'missing_start');
  end if;

  if target.ends_at is not null and target.ends_at <= target.starts_at then
    issues := array_append(issues, 'invalid_end');
  end if;

  if coalesce(btrim(target.timezone), '') = '' then
    issues := array_append(issues, 'missing_timezone');
  end if;

  if coalesce(btrim(target.city), '') = '' and coalesce(btrim(target.location_text), '') = '' then
    issues := array_append(issues, 'missing_location');
  end if;

  if coalesce(btrim(target.organizer_name), '') = '' then
    issues := array_append(issues, 'missing_organizer');
  elsif target.publication_source = 'reviewed' and organizer_key in ('noxaradar', 'omae', 'amotoe', 'αμοτοε') then
    issues := array_append(issues, 'source_as_organizer');
  end if;

  if target.publication_source = 'reviewed' then
    if coalesce(btrim(target.summary), '') = '' then
      issues := array_append(issues, 'missing_summary');
    elsif summary_text = 'this is an event reminder'
       or summary_text like '%review the original source before publishing%'
       or summary_text like 'official omae event announcement%'
       or summary_text like 'official α.μοτ.ο.ε. announcement%'
       or summary_text like 'official amotoe announcement%' then
      issues := array_append(issues, 'placeholder_summary');
    elsif char_length(btrim(target.summary)) < 32 then
      issues := array_append(issues, 'short_summary');
    end if;
  end if;

  if target.source_url !~* '^https?://[^[:space:]]+$' then
    issues := array_append(issues, 'invalid_source_url');
  end if;

  if target.country_code !~ '^[A-Z]{2}$' then
    issues := array_append(issues, 'invalid_country');
  end if;

  if target.latitude is not null and target.location_precision = 'unknown' then
    issues := array_append(issues, 'coordinates_without_precision');
  end if;

  if target.location_precision = 'exact' and (target.latitude is null or target.longitude is null) then
    issues := array_append(issues, 'exact_location_without_coordinates');
  end if;

  if coalesce(target.location_precision, 'unknown') <> 'exact' then
    issues := array_append(issues, 'map_location_not_exact');
  end if;

  if target.latitude is null or target.longitude is null then
    issues := array_append(issues, 'map_coordinates_missing');
  end if;

  return issues;
end;
$$;

create or replace function private.enforce_radar_event_quality_on_publish()
returns trigger
language plpgsql
set search_path = public, private
as $$
declare
  issues text[];
  should_check boolean := false;
begin
  if tg_op = 'INSERT' then
    should_check := new.status = 'published';
  elsif tg_op = 'UPDATE' then
    -- This trigger only fires for status/map-location fields, so re-check any published row it touches.
    should_check := new.status = 'published';
  end if;

  if should_check then
    issues := private.radar_event_quality_issues(new);
    if cardinality(issues) > 0 then
      raise exception 'RADAR_QUALITY_GATE:%', array_to_string(issues, ',')
        using errcode = '23514';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists radar_event_quality_gate on public.radar_events;
create trigger radar_event_quality_gate
before insert or update of status, latitude, longitude, location_precision
on public.radar_events
for each row
execute function private.enforce_radar_event_quality_on_publish();

revoke all on function private.radar_candidate_quality_issues(public.radar_candidates) from public;
revoke all on function private.radar_event_quality_issues(public.radar_events) from public;
revoke all on function private.enforce_radar_event_quality_on_publish() from public;

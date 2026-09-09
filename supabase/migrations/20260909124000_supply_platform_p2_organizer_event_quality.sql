-- Supply Platform P2: verified organizers can self-publish, but they must meet
-- the same user-facing content quality as reviewed Radar events.
-- Map/location requirements remain unchanged and fail closed.

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
  requires_user_summary boolean := target.publication_source in ('reviewed', 'organizer');
begin
  if coalesce(btrim(target.title), '') = '' then
    issues := array_append(issues, 'missing_title');
  elsif lower(btrim(target.title)) in ('tbd', 'to be announced', 'untitled', 'event reminder', 'coming soon') then
    issues := array_append(issues, 'placeholder_title');
  end if;

  if target.starts_at is null then issues := array_append(issues, 'missing_start'); end if;
  if target.ends_at is not null and target.ends_at <= target.starts_at then
    issues := array_append(issues, 'invalid_end');
  end if;
  if coalesce(btrim(target.timezone), '') = '' then issues := array_append(issues, 'missing_timezone'); end if;
  if coalesce(btrim(target.city), '') = '' and coalesce(btrim(target.location_text), '') = '' then
    issues := array_append(issues, 'missing_location');
  end if;

  if coalesce(btrim(target.organizer_name), '') = '' then
    issues := array_append(issues, 'missing_organizer');
  elsif target.publication_source = 'reviewed' and organizer_key in ('noxaradar', 'omae', 'amotoe', 'αμοτοε') then
    issues := array_append(issues, 'source_as_organizer');
  end if;

  if target.publication_source = 'organizer' and target.organizer_profile_id is null then
    issues := array_append(issues, 'missing_organizer_profile');
  end if;

  if requires_user_summary then
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

  if coalesce(target.country_code, '') !~ '^[A-Z]{2}$' then
    issues := array_append(issues, 'invalid_country');
  elsif target.country_code <> 'GR' then
    issues := array_append(issues, 'outside_greece');
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

-- The existing radar_event_quality_gate already covers INSERT and any update
-- that changes status/coordinates. Add a narrow organizer-only update trigger so
-- a verified organizer cannot publish a valid event and then bypass the gate by
-- changing title/date/location/summary/source through the REST API.
drop trigger if exists radar_organizer_event_quality_gate on public.radar_events;
create trigger radar_organizer_event_quality_gate
before update of
  title,
  event_type,
  starts_at,
  ends_at,
  timezone,
  location_text,
  city,
  region,
  organizer_name,
  summary,
  source_url,
  country_code,
  organizer_profile_id,
  publication_source
on public.radar_events
for each row
when (new.publication_source = 'organizer' and new.status = 'published')
execute function private.enforce_radar_event_quality_on_publish();

comment on function private.radar_event_quality_issues(public.radar_events) is
  'Fail-closed publication quality gate for reviewed and organizer-owned NOXA events. Organizer publication requires a useful summary, exact map point, Greece scope and organizer identity.';

-- Reliability Gate P0: NOXA Website publishes automotive events in Greece only.
-- Raw candidates may still be collected for audit/review, but publication must fail closed.

create or replace function private.radar_is_moto_only_event(
  p_event_type text,
  p_title text,
  p_summary text,
  p_organizer_name text,
  p_source_url text
)
returns boolean
language sql
immutable
set search_path = public, private
as $$
  select
    coalesce(p_event_type, '') = 'moto_meet'
    or coalesce(p_source_url, '') ~* '^https?://([^/]+\.)?amotoe\.org(/|$)'
    or concat_ws(' ', p_title, p_summary, p_organizer_name, p_source_url) ~*
      '(^|[^[:alnum:]_])(moto([ -]?(meet(ing)?|days?|expo|rally))?|motocross|motorcycles?|motorbikes?|vespa|scooters?|enduro|supermoto|motogp|bikeit|bikers?)([^[:alnum:]_]|$)'
    or concat_ws(' ', p_title, p_summary, p_organizer_name) ~*
      '(μοτοσυκλ|μοτοκρ[οό]ς|μοτοανεξαρτ|μοτολ[εέ]σχ)';
$$;

revoke all on function private.radar_is_moto_only_event(text, text, text, text, text) from public;

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

  if target.starts_at is null then issues := array_append(issues, 'missing_start'); end if;
  if target.ends_at is not null and target.starts_at is not null and target.ends_at <= target.starts_at then
    issues := array_append(issues, 'invalid_end');
  end if;
  if coalesce(btrim(target.timezone), '') = '' then issues := array_append(issues, 'missing_timezone'); end if;
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

  if coalesce(target.country_code, '') !~ '^[A-Z]{2}$' then
    issues := array_append(issues, 'invalid_country');
  elsif target.country_code <> 'GR' then
    issues := array_append(issues, 'outside_greece');
  end if;

  if private.radar_is_moto_only_event(
    target.event_type,
    target.title,
    target.summary,
    target.organizer_name,
    target.original_url
  ) then
    issues := array_append(issues, 'moto_only_event');
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

  if coalesce(target.country_code, '') !~ '^[A-Z]{2}$' then
    issues := array_append(issues, 'invalid_country');
  elsif target.country_code <> 'GR' then
    issues := array_append(issues, 'outside_greece');
  end if;

  if private.radar_is_moto_only_event(
    target.event_type,
    target.title,
    target.summary,
    target.organizer_name,
    target.source_url
  ) then
    issues := array_append(issues, 'moto_only_event');
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

revoke all on function private.radar_candidate_quality_issues(public.radar_candidates) from public;
revoke all on function private.radar_event_quality_issues(public.radar_events) from public;

-- Existing public rows outside the now-canonical product scope must no longer remain public.
update public.radar_events
set status = 'unpublished', updated_at = now()
where status = 'published'
  and (
    country_code is distinct from 'GR'
    or private.radar_is_moto_only_event(event_type, title, summary, organizer_name, source_url)
  );

-- Leave raw candidates reviewable, but make the automatic decision explicit immediately.
update public.radar_candidates
set
  auto_publish_outcome = 'blocked',
  auto_publish_reason = case
    when country_code is distinct from 'GR' then 'Scope Gate: outside_greece'
    else 'Scope Gate: moto_only_event'
  end,
  auto_publish_attempted_at = now(),
  updated_at = now()
where status = 'new'
  and auto_publish_outcome is distinct from 'published'
  and (
    country_code is distinct from 'GR'
    or private.radar_is_moto_only_event(event_type, title, summary, organizer_name, original_url)
  );

comment on function private.radar_is_moto_only_event(text, text, text, text, text) is
  'Fail-closed scope classifier for motorcycle-only events. NOXA Website publishes automotive/car events in Greece only.';

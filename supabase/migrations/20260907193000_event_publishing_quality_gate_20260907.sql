-- NOXA website: authoritative publication quality gate for public Meet events.
-- New publication attempts are blocked when factual/public-facing requirements fail.
-- Existing legacy published rows are not silently unpublished; rows that already pass
-- are marked as quality-gated, while legacy failures remain visible for cleanup.

alter table public.radar_events
  add column if not exists publication_quality_version smallint not null default 0,
  add column if not exists publication_quality_passed_at timestamptz;

-- Keep the review queue taxonomy aligned with the public event taxonomy.
alter table public.radar_candidates
  drop constraint if exists radar_candidates_event_type_check;

alter table public.radar_candidates
  add constraint radar_candidates_event_type_check
  check (event_type = any (array[
    'car_meet'::text,
    'moto_meet'::text,
    'track_day'::text,
    'drag'::text,
    'drift'::text,
    'rally'::text,
    'show'::text,
    'cars_and_coffee'::text,
    'group_drive'::text,
    'festival'::text,
    'karting'::text,
    'dexterity'::text,
    'other'::text
  ]));

create or replace function private.radar_event_publication_issues(target public.radar_events)
returns text[]
language plpgsql
stable
set search_path = public, private
as $$
declare
  issues text[] := '{}'::text[];
  normalized_title text := btrim(coalesce(target.title, ''));
  normalized_summary text := btrim(coalesce(target.summary, ''));
  normalized_organizer text := btrim(coalesce(target.organizer_name, ''));
  normalized_source text := btrim(coalesce(target.source_name, ''));
  normalized_location text := coalesce(nullif(btrim(coalesce(target.location_text, '')), ''), nullif(btrim(coalesce(target.city, '')), ''));
  summary_lower text := lower(btrim(coalesce(target.summary, '')));
  title_lower text := lower(btrim(coalesce(target.title, '')));
begin
  if char_length(normalized_title) < 4 then
    issues := array_append(issues, 'missing_title');
  elsif char_length(normalized_title) > 220 then
    issues := array_append(issues, 'title_too_long');
  end if;

  if title_lower like '%| αναγγελία'
     or title_lower like '%| αναγγελια'
     or title_lower like '%| announcement'
     or title_lower like '%| δελτίο τύπου'
     or title_lower like '%| δελτιο τυπου' then
    issues := array_append(issues, 'announcement_title');
  end if;

  if target.starts_at is null then
    issues := array_append(issues, 'missing_start_time');
  end if;

  if target.ends_at is not null and target.starts_at is not null and target.ends_at <= target.starts_at then
    issues := array_append(issues, 'end_before_start');
  end if;

  if btrim(coalesce(target.timezone, '')) = '' then
    issues := array_append(issues, 'missing_timezone');
  elsif not exists (select 1 from pg_timezone_names where name = target.timezone) then
    issues := array_append(issues, 'invalid_timezone');
  end if;

  if normalized_location is null then
    issues := array_append(issues, 'missing_location');
  end if;

  if char_length(normalized_organizer) < 2 then
    issues := array_append(issues, 'missing_organizer');
  end if;

  if target.publication_source = 'reviewed'
     and lower(normalized_organizer) = lower(normalized_source)
     and lower(normalized_source) in ('omae', 'amotoe', 'α.μοτ.ο.ε.', 'αμοτοε') then
    issues := array_append(issues, 'source_is_not_organizer');
  end if;

  if btrim(coalesce(target.source_url, '')) !~* '^https://[^[:space:]]+$' then
    issues := array_append(issues, 'invalid_source_url');
  end if;

  if char_length(normalized_summary) < 80 then
    issues := array_append(issues, 'summary_too_short');
  end if;

  if summary_lower like '%review the original source before publishing%'
     or summary_lower like '%official omae event announcement%'
     or summary_lower like '%official α.μοτ.ο.ε.%'
     or summary_lower like '%official amotoe announcement%'
     or summary_lower like '%this is an event reminder%'
     or summary_lower like '%check the organizer''s official details%'
     or summary_lower ~ '(^|[^[:alnum:]_])(placeholder|todo|tbd)([^[:alnum:]_]|$)' then
    issues := array_append(issues, 'service_summary');
  end if;

  if nullif(btrim(coalesce(target.cover_image_url, '')), '') is not null then
    if target.cover_image_url !~* '^https://[^[:space:]]+$' then
      issues := array_append(issues, 'invalid_cover_url');
    end if;
    if btrim(coalesce(target.cover_image_source_url, '')) !~* '^https://[^[:space:]]+$' then
      issues := array_append(issues, 'missing_cover_source');
    end if;
    if char_length(btrim(coalesce(target.cover_image_alt, ''))) < 6
       and char_length(btrim(coalesce(target.cover_image_alt_el, ''))) < 6 then
      issues := array_append(issues, 'missing_cover_alt');
    end if;
  end if;

  if target.location_precision = 'exact' and (target.latitude is null or target.longitude is null) then
    issues := array_append(issues, 'exact_location_without_coordinates');
  end if;

  return issues;
end;
$$;

create or replace function private.radar_event_publication_warnings(target public.radar_events)
returns text[]
language plpgsql
stable
set search_path = public, private
as $$
declare
  warnings text[] := '{}'::text[];
begin
  if target.country_code = 'GR' then
    if btrim(coalesce(target.title_el, '')) = '' then warnings := array_append(warnings, 'missing_greek_title'); end if;
    if btrim(coalesce(target.summary_el, '')) = '' then warnings := array_append(warnings, 'missing_greek_summary'); end if;
    if btrim(coalesce(target.location_text_el, '')) = '' then warnings := array_append(warnings, 'missing_greek_location'); end if;
  end if;

  if btrim(coalesce(target.cover_image_url, '')) = '' then
    warnings := array_append(warnings, 'no_verified_event_image');
  end if;

  if target.location_precision <> 'exact' then
    warnings := array_append(warnings, 'map_unavailable');
  end if;

  if target.event_type = 'other' then
    warnings := array_append(warnings, 'generic_event_type');
  end if;

  return warnings;
end;
$$;

create or replace function private.enforce_radar_event_publication_quality()
returns trigger
language plpgsql
security definer
set search_path = public, private
as $$
declare
  issues text[];
  should_check boolean := false;
begin
  if new.status <> 'published' then
    new.publication_quality_version := 0;
    new.publication_quality_passed_at := null;
    return new;
  end if;

  if tg_op = 'INSERT' then
    should_check := true;
  elsif old.status is distinct from 'published' then
    should_check := true;
  elsif coalesce(old.publication_quality_version, 0) >= 1 then
    should_check := true;
  elsif new.publication_quality_version is distinct from old.publication_quality_version
     or new.publication_quality_passed_at is distinct from old.publication_quality_passed_at then
    should_check := true;
  end if;

  if should_check then
    issues := private.radar_event_publication_issues(new);
    if coalesce(cardinality(issues), 0) > 0 then
      raise exception 'Publication quality gate failed: %', array_to_string(issues, ', ')
        using errcode = '23514',
              hint = 'Keep the event unpublished until the listed factual/public-facing fields are corrected.';
    end if;

    new.publication_quality_version := 1;
    new.publication_quality_passed_at := now();
  end if;

  return new;
end;
$$;

-- Mark only legacy rows that already satisfy v1. Legacy failures remain published for
-- controlled cleanup; they are not silently removed from the site by this migration.
update public.radar_events e
set publication_quality_version = 1,
    publication_quality_passed_at = now()
where e.status = 'published'
  and coalesce(e.publication_quality_version, 0) = 0
  and coalesce(cardinality(private.radar_event_publication_issues(e)), 0) = 0;

drop trigger if exists enforce_radar_event_publication_quality on public.radar_events;
create trigger enforce_radar_event_publication_quality
before insert or update of
  status,
  title,
  event_type,
  starts_at,
  ends_at,
  timezone,
  location_text,
  city,
  organizer_name,
  source_name,
  source_url,
  summary,
  cover_image_url,
  cover_image_source_url,
  cover_image_alt,
  cover_image_alt_el,
  latitude,
  longitude,
  location_precision,
  publication_source,
  publication_quality_version,
  publication_quality_passed_at
on public.radar_events
for each row execute function private.enforce_radar_event_publication_quality();

-- Candidate approval stays atomic: if the generated public event fails the gate,
-- the candidate cannot become approved and remains available for correction.
create or replace function private.publish_approved_radar_candidate()
returns trigger
language plpgsql
set search_path = public, private
as $$
declare
  should_publish boolean := false;
  source_label text;
begin
  if new.status = 'approved' then
    if new.starts_at is null then
      raise exception 'Publication quality gate failed: missing_start_time'
        using errcode = '23514',
              hint = 'Keep the candidate in review until a verified start date and time is available.';
    end if;

    if tg_op = 'INSERT' then
      should_publish := true;
    elsif old.status is distinct from 'approved' then
      should_publish := true;
    end if;
  end if;

  if should_publish then
    select nullif(btrim(name), '') into source_label
    from public.radar_sources
    where id = new.source_id;

    insert into public.radar_events (
      candidate_id,
      source_id,
      country_code,
      title,
      event_type,
      starts_at,
      ends_at,
      timezone,
      location_text,
      city,
      region,
      organizer_name,
      organizer_url,
      source_name,
      source_url,
      summary,
      publication_source,
      status
    ) values (
      new.id,
      new.source_id,
      new.country_code,
      new.title,
      new.event_type,
      new.starts_at,
      new.ends_at,
      coalesce(nullif(btrim(new.timezone), ''), 'UTC'),
      new.location_text,
      new.city,
      new.region,
      new.organizer_name,
      new.organizer_url,
      coalesce(source_label, nullif(btrim(new.organizer_name), ''), 'NOXA Radar'),
      new.original_url,
      new.summary,
      'reviewed',
      'published'
    )
    on conflict do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists radar_candidate_publish_on_approval on public.radar_candidates;
create trigger radar_candidate_publish_on_approval
after insert or update of status on public.radar_candidates
for each row execute function private.publish_approved_radar_candidate();

create or replace function public.radar_publication_quality_audit()
returns table (
  event_id uuid,
  event_title text,
  event_status text,
  quality_version smallint,
  quality_passed_at timestamptz,
  blockers text[],
  warnings text[]
)
language plpgsql
security definer
set search_path = public, private
as $$
begin
  if not private.is_radar_admin() then
    raise exception 'Not authorized' using errcode = '42501';
  end if;

  return query
  select
    e.id,
    e.title,
    e.status,
    e.publication_quality_version,
    e.publication_quality_passed_at,
    private.radar_event_publication_issues(e),
    private.radar_event_publication_warnings(e)
  from public.radar_events e
  order by
    (coalesce(cardinality(private.radar_event_publication_issues(e)), 0) > 0) desc,
    e.starts_at asc;
end;
$$;

revoke all on function private.radar_event_publication_issues(public.radar_events) from public;
revoke all on function private.radar_event_publication_warnings(public.radar_events) from public;
revoke all on function private.enforce_radar_event_publication_quality() from public;
revoke all on function private.publish_approved_radar_candidate() from public;
revoke all on function public.radar_publication_quality_audit() from public;
grant execute on function public.radar_publication_quality_audit() to authenticated;

comment on column public.radar_events.publication_quality_version is
  '0 = legacy/draft/not quality-gated; 1 = passed NOXA Event Publishing Quality Gate v1.';
comment on column public.radar_events.publication_quality_passed_at is
  'When the current published event data last passed the NOXA publication quality gate.';
comment on function public.radar_publication_quality_audit() is
  'Admin-only audit of hard publication blockers and non-blocking editorial warnings for website events.';

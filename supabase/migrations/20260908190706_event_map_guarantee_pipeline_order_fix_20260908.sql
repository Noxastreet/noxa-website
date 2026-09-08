-- P0 correction: keep content enrichment independent from later location verification.
-- Exact map location is enforced only at approval / auto-publication, preserving
-- Source -> Enrichment -> Location verification -> Approval -> Published -> Map.

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
  if target.original_url !~* '^https?://[^[:space:]]+$' then issues := array_append(issues, 'invalid_source_url'); end if;
  if target.country_code !~ '^[A-Z]{2}$' then issues := array_append(issues, 'invalid_country'); end if;
  return issues;
end;
$$;

create or replace function private.radar_candidate_map_issues(target public.radar_candidates)
returns text[]
language plpgsql
stable
set search_path = public, private
as $$
declare
  issues text[] := array[]::text[];
begin
  if coalesce(target.location_precision, 'unknown') <> 'exact' then
    issues := array_append(issues, 'map_location_not_exact');
  end if;
  if target.latitude is null or target.longitude is null then
    issues := array_append(issues, 'map_coordinates_missing');
  end if;
  return issues;
end;
$$;

create or replace function private.enforce_radar_candidate_quality_on_approval()
returns trigger
language plpgsql
set search_path = public, private
as $$
declare
  issues text[];
begin
  if new.status = 'approved' and old.status is distinct from 'approved' then
    issues := array_cat(
      private.radar_candidate_quality_issues(new),
      private.radar_candidate_map_issues(new)
    );
    if cardinality(issues) > 0 then
      raise exception 'RADAR_QUALITY_GATE:%', array_to_string(issues, ',')
        using errcode = '23514';
    end if;
  end if;
  return new;
end;
$$;

create or replace function private.radar_auto_publish_verified(p_limit integer default 8)
returns table (
  candidate_id uuid,
  outcome text,
  event_id uuid,
  reason text
)
language plpgsql
security definer
set search_path = public, private
as $$
declare
  candidate_row public.radar_candidates%rowtype;
  issues text[];
  map_issues text[];
  duplicate_event_id uuid;
  published_event_id uuid;
  block_reason text;
begin
  for candidate_row in
    select c.*
    from public.radar_candidates c
    join public.radar_sources s on s.id = c.source_id
    where c.status = 'new'
      and c.duplicate_of is null
      and c.enrichment_outcome = 'verified'
      and c.source_verified_at is not null
      and c.source_verified_at > now() - interval '24 hours'
      and coalesce(c.ai_confidence, 0) >= 0.92
      and c.reviewed_by is null
      and c.starts_at > now()
      and c.media_location_attempted_at is not null
      and c.media_location_outcome in ('verified', 'partial', 'none')
      and s.active = true
      and s.trust_level = 'trusted'
      and c.auto_publish_outcome is distinct from 'published'
      and not exists (select 1 from public.radar_events e where e.candidate_id = c.id)
    order by c.created_at asc
    limit greatest(1, least(coalesce(p_limit, 8), 16))
  loop
    begin
      issues := private.radar_candidate_quality_issues(candidate_row);
      map_issues := private.radar_candidate_map_issues(candidate_row);
      duplicate_event_id := private.radar_auto_publish_duplicate_event_id(candidate_row);
      block_reason := null;

      if cardinality(issues) > 0 then
        block_reason := 'Quality Gate: ' || array_to_string(issues, ',');
      elsif duplicate_event_id is not null then
        block_reason := 'Duplicate published event: ' || duplicate_event_id::text;
      elsif cardinality(map_issues) > 0 then
        block_reason := 'Map Gate: ' || array_to_string(map_issues, ',');
      elsif coalesce(btrim(candidate_row.title_el), '') = '' then
        block_reason := 'Missing Greek title localization.';
      elsif coalesce(btrim(candidate_row.summary_el), '') = '' then
        block_reason := 'Missing Greek summary localization.';
      elsif coalesce(btrim(candidate_row.location_text), '') <> ''
        and coalesce(btrim(candidate_row.location_text_el), '') = '' then
        block_reason := 'Missing Greek location localization.';
      end if;

      if block_reason is not null then
        update public.radar_candidates
        set auto_publish_outcome = 'blocked',
            auto_publish_reason = left(block_reason, 1500),
            auto_publish_attempted_at = now(),
            updated_at = now()
        where id = candidate_row.id and status = 'new';
        candidate_id := candidate_row.id;
        outcome := 'blocked';
        event_id := duplicate_event_id;
        reason := block_reason;
        return next;
        continue;
      end if;

      update public.radar_candidates
      set status = 'approved', reviewed_at = now(), auto_publish_attempted_at = now(),
          auto_publish_reason = 'Automatically approved after verified enrichment, source verification, dedupe, Map Gate and Quality Gate checks.',
          updated_at = now()
      where id = candidate_row.id and status = 'new' and reviewed_by is null;
      if not found then continue; end if;

      select e.id into published_event_id
      from public.radar_events e
      where e.candidate_id = candidate_row.id and e.status = 'published'
      order by e.published_at desc limit 1;
      if published_event_id is null then
        raise exception 'Auto-publication trigger did not create radar_event for candidate %', candidate_row.id;
      end if;

      update public.radar_events set publication_source = 'auto', updated_at = now() where id = published_event_id;
      update public.radar_candidates
      set auto_publish_outcome = 'published',
          auto_publish_reason = 'Automatically published after verified enrichment, source verification, dedupe, Map Gate and Quality Gate checks.',
          auto_publish_attempted_at = now(), auto_published_at = now(), updated_at = now()
      where id = candidate_row.id;

      candidate_id := candidate_row.id;
      outcome := 'published';
      event_id := published_event_id;
      reason := 'Verified candidate automatically published and map-eligible.';
      return next;
    exception when others then
      update public.radar_candidates
      set auto_publish_outcome = 'failed',
          auto_publish_reason = left('Auto-publish failed: ' || sqlerrm, 1500),
          auto_publish_attempted_at = now(), updated_at = now()
      where id = candidate_row.id and status = 'new';
      candidate_id := candidate_row.id;
      outcome := 'failed';
      event_id := null;
      reason := left(sqlerrm, 1500);
      return next;
    end;
  end loop;
end;
$$;

revoke all on function private.radar_candidate_quality_issues(public.radar_candidates) from public;
revoke all on function private.radar_candidate_map_issues(public.radar_candidates) from public;
revoke all on function private.enforce_radar_candidate_quality_on_approval() from public;
revoke all on function private.radar_auto_publish_verified(integer) from public;

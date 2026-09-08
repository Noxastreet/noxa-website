-- TICKET 1B: automatic Radar enrichment without automatic approval/publication.

alter table public.radar_candidates
  add column if not exists title_el text,
  add column if not exists summary_el text,
  add column if not exists location_text_el text,
  add column if not exists enrichment_outcome text,
  add column if not exists enrichment_reason text,
  add column if not exists enrichment_model text,
  add column if not exists enrichment_attempted_at timestamptz,
  add column if not exists source_verified_at timestamptz;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.radar_candidates'::regclass
      and conname = 'radar_candidates_enrichment_outcome_check'
  ) then
    alter table public.radar_candidates
      add constraint radar_candidates_enrichment_outcome_check
      check (enrichment_outcome is null or enrichment_outcome in ('verified', 'review_required', 'rejected', 'failed'));
  end if;
end $$;

create or replace function private.radar_enrichment_secret_valid(p_secret text)
returns boolean
language sql
security definer
set search_path = public, private, extensions
as $$
  select coalesce(
    exists (
      select 1
      from public.radar_internal_secrets s
      where s.name = 'radar_collector_cron_secret'
        and s.secret_hash = encode(digest(coalesce(p_secret, ''), 'sha256'), 'hex')
    ),
    false
  );
$$;

revoke all on function private.radar_enrichment_secret_valid(text) from public;

create or replace function public.radar_enrichment_batch(p_secret text, p_limit integer default 8)
returns table (
  id uuid,
  source_id uuid,
  title text,
  country_code text,
  event_type text,
  starts_at timestamptz,
  ends_at timestamptz,
  timezone text,
  location_text text,
  city text,
  region text,
  organizer_name text,
  organizer_url text,
  summary text,
  original_url text,
  raw_payload jsonb,
  source_url text,
  source_name text,
  trust_level text
)
language plpgsql
security definer
set search_path = public, private, extensions
as $$
begin
  if not private.radar_enrichment_secret_valid(p_secret) then
    raise insufficient_privilege using message = 'Unauthorized';
  end if;

  return query
  select
    c.id,
    c.source_id,
    c.title,
    c.country_code,
    c.event_type,
    c.starts_at,
    c.ends_at,
    c.timezone,
    c.location_text,
    c.city,
    c.region,
    c.organizer_name,
    c.organizer_url,
    c.summary,
    c.original_url,
    c.raw_payload,
    s.url as source_url,
    s.name as source_name,
    s.trust_level
  from public.radar_candidates c
  left join public.radar_sources s on s.id = c.source_id
  where c.status in ('new', 'needs_review')
    and c.duplicate_of is null
    and (
      c.enrichment_attempted_at is null
      or (c.enrichment_outcome = 'failed' and c.enrichment_attempted_at < now() - interval '6 hours')
    )
  order by c.created_at asc
  limit greatest(1, least(coalesce(p_limit, 8), 16));
end;
$$;

create or replace function public.radar_apply_enrichment(
  p_secret text,
  p_candidate_id uuid,
  p_title text,
  p_event_type text,
  p_location_text text,
  p_city text,
  p_region text,
  p_organizer_name text,
  p_organizer_url text,
  p_summary text,
  p_title_el text,
  p_summary_el text,
  p_location_text_el text,
  p_confidence numeric,
  p_reason text,
  p_model text,
  p_outcome text,
  p_source_verified_at timestamptz default null
)
returns boolean
language plpgsql
security definer
set search_path = public, private, extensions
as $$
declare
  v_count integer := 0;
  v_outcome text := case
    when p_outcome in ('verified', 'review_required', 'rejected') then p_outcome
    else 'review_required'
  end;
begin
  if not private.radar_enrichment_secret_valid(p_secret) then
    raise insufficient_privilege using message = 'Unauthorized';
  end if;

  update public.radar_candidates c
  set
    title = coalesce(nullif(btrim(p_title), ''), c.title),
    event_type = case
      when p_event_type = any (array['car_meet','moto_meet','track_day','drag','drift','rally','show','cars_and_coffee','group_drive','festival','other'])
        then p_event_type
      else c.event_type
    end,
    location_text = coalesce(nullif(btrim(p_location_text), ''), c.location_text),
    city = coalesce(nullif(btrim(p_city), ''), c.city),
    region = coalesce(nullif(btrim(p_region), ''), c.region),
    organizer_name = coalesce(nullif(btrim(p_organizer_name), ''), c.organizer_name),
    organizer_url = coalesce(nullif(btrim(p_organizer_url), ''), c.organizer_url),
    summary = coalesce(nullif(btrim(p_summary), ''), c.summary),
    title_el = coalesce(nullif(btrim(p_title_el), ''), c.title_el),
    summary_el = coalesce(nullif(btrim(p_summary_el), ''), c.summary_el),
    location_text_el = coalesce(nullif(btrim(p_location_text_el), ''), c.location_text_el),
    ai_confidence = greatest(0, least(coalesce(p_confidence, 0.5), 1)),
    ai_reason = left(coalesce(p_reason, ''), 1500),
    ai_model = nullif(btrim(p_model), ''),
    ai_analyzed_at = now(),
    enrichment_outcome = v_outcome,
    enrichment_reason = left(coalesce(p_reason, ''), 1500),
    enrichment_model = nullif(btrim(p_model), ''),
    enrichment_attempted_at = now(),
    source_verified_at = coalesce(p_source_verified_at, c.source_verified_at),
    status = case when v_outcome = 'verified' then 'new' else 'needs_review' end,
    updated_at = now()
  where c.id = p_candidate_id
    and c.status in ('new', 'needs_review');

  get diagnostics v_count = row_count;
  return v_count > 0;
end;
$$;

create or replace function public.radar_mark_enrichment_failed(
  p_secret text,
  p_candidate_id uuid,
  p_reason text
)
returns boolean
language plpgsql
security definer
set search_path = public, private, extensions
as $$
declare
  v_count integer := 0;
begin
  if not private.radar_enrichment_secret_valid(p_secret) then
    raise insufficient_privilege using message = 'Unauthorized';
  end if;

  update public.radar_candidates
  set
    enrichment_outcome = 'failed',
    enrichment_reason = left(coalesce(p_reason, 'Automatic enrichment failed.'), 1500),
    enrichment_attempted_at = now(),
    updated_at = now()
  where id = p_candidate_id
    and status in ('new', 'needs_review');

  get diagnostics v_count = row_count;
  return v_count > 0;
end;
$$;

revoke all on function public.radar_enrichment_batch(text, integer) from public;
revoke all on function public.radar_apply_enrichment(text, uuid, text, text, text, text, text, text, text, text, text, text, text, numeric, text, text, text, timestamptz) from public;
revoke all on function public.radar_mark_enrichment_failed(text, uuid, text) from public;

grant execute on function public.radar_enrichment_batch(text, integer) to anon, authenticated;
grant execute on function public.radar_apply_enrichment(text, uuid, text, text, text, text, text, text, text, text, text, text, text, numeric, text, text, text, timestamptz) to anon, authenticated;
grant execute on function public.radar_mark_enrichment_failed(text, uuid, text) to anon, authenticated;

create or replace function private.publish_approved_radar_candidate()
returns trigger
language plpgsql
set search_path = public, private
as $$
begin
  if new.status = 'approved' and old.status is distinct from 'approved' and new.starts_at is not null then
    insert into public.radar_events (
      candidate_id, source_id, country_code, title, event_type, starts_at, ends_at,
      timezone, location_text, city, region, organizer_name, organizer_url,
      source_name, source_url, summary, title_el, summary_el, location_text_el, status
    )
    values (
      new.id, new.source_id, new.country_code, new.title, new.event_type, new.starts_at, new.ends_at,
      coalesce(new.timezone, 'UTC'), new.location_text, new.city, new.region, new.organizer_name, new.organizer_url,
      coalesce(new.organizer_name, 'NOXA Radar'), new.original_url, new.summary,
      new.title_el, new.summary_el, new.location_text_el, 'published'
    )
    on conflict do nothing;
  end if;
  return new;
end;
$$;

-- Run enrichment after the structured collector (minute 17) and social status collector (minute 27).
do $$
declare
  existing_job bigint;
begin
  select jobid into existing_job
  from cron.job
  where jobname = 'radar-enricher-every-6h'
  limit 1;

  if existing_job is not null then
    perform cron.unschedule(existing_job);
  end if;

  perform cron.schedule(
    'radar-enricher-every-6h',
    '37 */6 * * *',
    $cron$
      select net.http_post(
        url := 'https://noxastreetapp.com/api/radar/enrich',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'x-radar-cron-secret', (
            select decrypted_secret
            from vault.decrypted_secrets
            where name = 'radar_collector_cron_secret'
            order by created_at desc
            limit 1
          )
        ),
        body := '{"mode":"scheduled"}'::jsonb
      );
    $cron$
  );
end $$;

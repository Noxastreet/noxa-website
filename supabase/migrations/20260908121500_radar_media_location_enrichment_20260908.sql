-- TICKET 1C: conservative event media + exact location enrichment.
-- No automatic approval/publication is introduced here.

alter table public.radar_candidates
  add column if not exists cover_image_url text,
  add column if not exists cover_image_source_url text,
  add column if not exists cover_image_alt text,
  add column if not exists cover_image_alt_el text,
  add column if not exists latitude double precision,
  add column if not exists longitude double precision,
  add column if not exists location_precision text not null default 'unknown',
  add column if not exists media_location_outcome text,
  add column if not exists media_location_reason text,
  add column if not exists media_location_attempted_at timestamptz;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.radar_candidates'::regclass
      and conname = 'radar_candidates_media_latitude_check'
  ) then
    alter table public.radar_candidates
      add constraint radar_candidates_media_latitude_check
      check (latitude is null or latitude between -90 and 90);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.radar_candidates'::regclass
      and conname = 'radar_candidates_media_longitude_check'
  ) then
    alter table public.radar_candidates
      add constraint radar_candidates_media_longitude_check
      check (longitude is null or longitude between -180 and 180);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.radar_candidates'::regclass
      and conname = 'radar_candidates_media_coordinate_pair_check'
  ) then
    alter table public.radar_candidates
      add constraint radar_candidates_media_coordinate_pair_check
      check ((latitude is null) = (longitude is null));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.radar_candidates'::regclass
      and conname = 'radar_candidates_media_location_precision_check'
  ) then
    alter table public.radar_candidates
      add constraint radar_candidates_media_location_precision_check
      check (location_precision in ('unknown', 'approximate', 'exact'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.radar_candidates'::regclass
      and conname = 'radar_candidates_media_exact_requires_coordinates_check'
  ) then
    alter table public.radar_candidates
      add constraint radar_candidates_media_exact_requires_coordinates_check
      check (location_precision <> 'exact' or (latitude is not null and longitude is not null));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.radar_candidates'::regclass
      and conname = 'radar_candidates_media_location_outcome_check'
  ) then
    alter table public.radar_candidates
      add constraint radar_candidates_media_location_outcome_check
      check (media_location_outcome is null or media_location_outcome in ('verified', 'partial', 'none', 'failed'));
  end if;
end $$;

create or replace function public.radar_media_location_batch(p_secret text, p_limit integer default 8)
returns table (
  id uuid,
  title text,
  title_el text,
  original_url text,
  source_url text,
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
    c.title,
    c.title_el,
    c.original_url,
    s.url as source_url,
    s.trust_level
  from public.radar_candidates c
  left join public.radar_sources s on s.id = c.source_id
  where c.status in ('new', 'needs_review')
    and c.duplicate_of is null
    and c.enrichment_outcome in ('verified', 'review_required')
    and (
      c.media_location_attempted_at is null
      or (c.media_location_outcome = 'failed' and c.media_location_attempted_at < now() - interval '6 hours')
      or (c.media_location_outcome = 'none' and c.media_location_attempted_at < now() - interval '7 days')
    )
  order by c.created_at asc
  limit greatest(1, least(coalesce(p_limit, 8), 16));
end;
$$;

create or replace function public.radar_apply_media_location(
  p_secret text,
  p_candidate_id uuid,
  p_cover_image_url text,
  p_cover_image_source_url text,
  p_cover_image_alt text,
  p_cover_image_alt_el text,
  p_latitude double precision,
  p_longitude double precision,
  p_location_precision text,
  p_outcome text,
  p_reason text
)
returns boolean
language plpgsql
security definer
set search_path = public, private, extensions
as $$
declare
  v_count integer := 0;
  v_precision text := case when p_location_precision = 'exact' and p_latitude is not null and p_longitude is not null then 'exact' else 'unknown' end;
  v_outcome text := case when p_outcome in ('verified', 'partial', 'none') then p_outcome else 'none' end;
begin
  if not private.radar_enrichment_secret_valid(p_secret) then
    raise insufficient_privilege using message = 'Unauthorized';
  end if;

  update public.radar_candidates c
  set
    cover_image_url = case when nullif(btrim(p_cover_image_url), '') is not null then btrim(p_cover_image_url) else c.cover_image_url end,
    cover_image_source_url = case when nullif(btrim(p_cover_image_url), '') is not null then coalesce(nullif(btrim(p_cover_image_source_url), ''), c.original_url) else c.cover_image_source_url end,
    cover_image_alt = case when nullif(btrim(p_cover_image_url), '') is not null then coalesce(nullif(btrim(p_cover_image_alt), ''), c.cover_image_alt) else c.cover_image_alt end,
    cover_image_alt_el = case when nullif(btrim(p_cover_image_url), '') is not null then coalesce(nullif(btrim(p_cover_image_alt_el), ''), c.cover_image_alt_el) else c.cover_image_alt_el end,
    latitude = case when v_precision = 'exact' then p_latitude else c.latitude end,
    longitude = case when v_precision = 'exact' then p_longitude else c.longitude end,
    location_precision = case when v_precision = 'exact' then 'exact' else c.location_precision end,
    media_location_outcome = v_outcome,
    media_location_reason = left(coalesce(p_reason, ''), 1500),
    media_location_attempted_at = now(),
    updated_at = now()
  where c.id = p_candidate_id
    and c.status in ('new', 'needs_review');

  get diagnostics v_count = row_count;
  return v_count > 0;
end;
$$;

create or replace function public.radar_mark_media_location_failed(
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
    media_location_outcome = 'failed',
    media_location_reason = left(coalesce(p_reason, 'Media/location enrichment failed.'), 1500),
    media_location_attempted_at = now(),
    updated_at = now()
  where id = p_candidate_id
    and status in ('new', 'needs_review');

  get diagnostics v_count = row_count;
  return v_count > 0;
end;
$$;

revoke all on function public.radar_media_location_batch(text, integer) from public;
revoke all on function public.radar_apply_media_location(text, uuid, text, text, text, text, double precision, double precision, text, text, text) from public;
revoke all on function public.radar_mark_media_location_failed(text, uuid, text) from public;

grant execute on function public.radar_media_location_batch(text, integer) to anon, authenticated;
grant execute on function public.radar_apply_media_location(text, uuid, text, text, text, text, double precision, double precision, text, text, text) to anon, authenticated;
grant execute on function public.radar_mark_media_location_failed(text, uuid, text) to anon, authenticated;

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
      source_name, source_url, summary, title_el, summary_el, location_text_el,
      cover_image_url, cover_image_source_url, cover_image_alt, cover_image_alt_el,
      latitude, longitude, location_precision, status
    )
    values (
      new.id, new.source_id, new.country_code, new.title, new.event_type, new.starts_at, new.ends_at,
      coalesce(new.timezone, 'UTC'), new.location_text, new.city, new.region, new.organizer_name, new.organizer_url,
      coalesce(new.organizer_name, 'NOXA Radar'), new.original_url, new.summary,
      new.title_el, new.summary_el, new.location_text_el,
      new.cover_image_url, new.cover_image_source_url, new.cover_image_alt, new.cover_image_alt_el,
      new.latitude, new.longitude, coalesce(new.location_precision, 'unknown'), 'published'
    )
    on conflict do nothing;
  end if;
  return new;
end;
$$;

-- Run after structured collector (17), social status collector (27), and AI enrichment (37).
do $$
declare
  existing_job bigint;
begin
  select jobid into existing_job
  from cron.job
  where jobname = 'radar-media-location-enricher-every-6h'
  limit 1;

  if existing_job is not null then
    perform cron.unschedule(existing_job);
  end if;

  perform cron.schedule(
    'radar-media-location-enricher-every-6h',
    '47 */6 * * *',
    $cron$
      select net.http_post(
        url := 'https://noxastreetapp.com/api/radar/enrich-media',
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

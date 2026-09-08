-- TICKET 1D: conservative automatic publication for fully verified Radar candidates.
-- Existing candidate/event Quality Gates stay in force and are not weakened.

alter table public.radar_candidates
  add column if not exists auto_publish_outcome text,
  add column if not exists auto_publish_reason text,
  add column if not exists auto_publish_attempted_at timestamptz,
  add column if not exists auto_published_at timestamptz;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.radar_candidates'::regclass
      and conname = 'radar_candidates_auto_publish_outcome_check'
  ) then
    alter table public.radar_candidates
      add constraint radar_candidates_auto_publish_outcome_check
      check (auto_publish_outcome is null or auto_publish_outcome in ('published', 'blocked', 'failed'));
  end if;
end $$;

alter table public.radar_events
  drop constraint if exists radar_events_publication_source_check;

alter table public.radar_events
  add constraint radar_events_publication_source_check
  check (publication_source in ('reviewed', 'organizer', 'auto'));

create or replace function private.radar_auto_publish_duplicate_event_id(target public.radar_candidates)
returns uuid
language sql
stable
set search_path = public, private
as $$
  select e.id
  from public.radar_events e
  where e.status = 'published'
    and (
      e.source_url = target.original_url
      or (
        regexp_replace(lower(btrim(e.title)), '[^[:alnum:]]+', '', 'g') =
          regexp_replace(lower(btrim(target.title)), '[^[:alnum:]]+', '', 'g')
        and (e.starts_at at time zone coalesce(target.timezone, 'UTC'))::date =
          (target.starts_at at time zone coalesce(target.timezone, 'UTC'))::date
        and (
          regexp_replace(lower(coalesce(btrim(e.organizer_name), '')), '[^[:alnum:]]+', '', 'g') =
            regexp_replace(lower(coalesce(btrim(target.organizer_name), '')), '[^[:alnum:]]+', '', 'g')
          or regexp_replace(lower(coalesce(btrim(e.city), '')), '[^[:alnum:]]+', '', 'g') =
            regexp_replace(lower(coalesce(btrim(target.city), '')), '[^[:alnum:]]+', '', 'g')
        )
      )
    )
  order by e.published_at desc
  limit 1;
$$;

revoke all on function private.radar_auto_publish_duplicate_event_id(public.radar_candidates) from public;

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
      and not exists (
        select 1 from public.radar_events e where e.candidate_id = c.id
      )
    order by c.created_at asc
    limit greatest(1, least(coalesce(p_limit, 8), 16))
  loop
    begin
      issues := private.radar_candidate_quality_issues(candidate_row);
      duplicate_event_id := private.radar_auto_publish_duplicate_event_id(candidate_row);
      block_reason := null;

      if cardinality(issues) > 0 then
        block_reason := 'Quality Gate: ' || array_to_string(issues, ',');
      elsif duplicate_event_id is not null then
        block_reason := 'Duplicate published event: ' || duplicate_event_id::text;
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
        set
          auto_publish_outcome = 'blocked',
          auto_publish_reason = left(block_reason, 1500),
          auto_publish_attempted_at = now(),
          updated_at = now()
        where id = candidate_row.id
          and status = 'new';

        candidate_id := candidate_row.id;
        outcome := 'blocked';
        event_id := duplicate_event_id;
        reason := block_reason;
        return next;
        continue;
      end if;

      update public.radar_candidates
      set
        status = 'approved',
        reviewed_at = now(),
        auto_publish_attempted_at = now(),
        auto_publish_reason = 'Automatically approved after verified enrichment, source verification, dedupe and Quality Gate checks.',
        updated_at = now()
      where id = candidate_row.id
        and status = 'new'
        and reviewed_by is null;

      if not found then
        continue;
      end if;

      select e.id
      into published_event_id
      from public.radar_events e
      where e.candidate_id = candidate_row.id
        and e.status = 'published'
      order by e.published_at desc
      limit 1;

      if published_event_id is null then
        raise exception 'Auto-publication trigger did not create radar_event for candidate %', candidate_row.id;
      end if;

      update public.radar_events
      set publication_source = 'auto', updated_at = now()
      where id = published_event_id;

      update public.radar_candidates
      set
        auto_publish_outcome = 'published',
        auto_publish_reason = 'Automatically published after verified enrichment, source verification, dedupe and Quality Gate checks.',
        auto_publish_attempted_at = now(),
        auto_published_at = now(),
        updated_at = now()
      where id = candidate_row.id;

      candidate_id := candidate_row.id;
      outcome := 'published';
      event_id := published_event_id;
      reason := 'Verified candidate automatically published.';
      return next;
    exception when others then
      update public.radar_candidates
      set
        auto_publish_outcome = 'failed',
        auto_publish_reason = left('Auto-publish failed: ' || sqlerrm, 1500),
        auto_publish_attempted_at = now(),
        updated_at = now()
      where id = candidate_row.id
        and status = 'new';

      candidate_id := candidate_row.id;
      outcome := 'failed';
      event_id := null;
      reason := left(sqlerrm, 1500);
      return next;
    end;
  end loop;
end;
$$;

revoke all on function private.radar_auto_publish_verified(integer) from public;

-- Run after collector (17), social status (27), AI enrichment (37), and media/location (47).
do $$
declare
  existing_job bigint;
begin
  select jobid into existing_job
  from cron.job
  where jobname = 'radar-auto-publisher-every-6h'
  limit 1;

  if existing_job is not null then
    perform cron.unschedule(existing_job);
  end if;

  perform cron.schedule(
    'radar-auto-publisher-every-6h',
    '57 */6 * * *',
    $cron$
      select * from private.radar_auto_publish_verified(8);
    $cron$
  );
end $$;

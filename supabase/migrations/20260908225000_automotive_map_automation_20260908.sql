-- P1 Map Content Expansion automation.
-- Automates verified map candidate publication and schedules a conservative source collector.
-- Existing map tables/functions remain canonical; no parallel content store is introduced.

alter table public.automotive_map_candidates
  add column if not exists automation_origin text not null default 'manual',
  add column if not exists verification_confidence double precision,
  add column if not exists verification_reason text,
  add column if not exists verification_attempted_at timestamptz,
  add column if not exists geometry_source_url text,
  add column if not exists auto_publish_outcome text,
  add column if not exists auto_publish_reason text,
  add column if not exists auto_publish_attempted_at timestamptz,
  add column if not exists auto_published_at timestamptz;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.automotive_map_candidates'::regclass
      and conname = 'automotive_map_candidate_automation_origin_check'
  ) then
    alter table public.automotive_map_candidates
      add constraint automotive_map_candidate_automation_origin_check
      check (automation_origin in ('manual', 'source_registry', 'osm_discovery'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.automotive_map_candidates'::regclass
      and conname = 'automotive_map_candidate_verification_confidence_check'
  ) then
    alter table public.automotive_map_candidates
      add constraint automotive_map_candidate_verification_confidence_check
      check (verification_confidence is null or (verification_confidence >= 0 and verification_confidence <= 1));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.automotive_map_candidates'::regclass
      and conname = 'automotive_map_candidate_auto_publish_outcome_check'
  ) then
    alter table public.automotive_map_candidates
      add constraint automotive_map_candidate_auto_publish_outcome_check
      check (auto_publish_outcome is null or auto_publish_outcome in ('blocked', 'duplicate', 'published', 'failed'));
  end if;
end $$;

create index if not exists automotive_map_candidates_automation_idx
  on public.automotive_map_candidates (status, automation_origin, auto_publish_outcome, created_at);

create index if not exists automotive_map_candidates_published_feature_idx
  on public.automotive_map_candidates (published_feature_id)
  where published_feature_id is not null;

create index if not exists automotive_map_features_source_idx
  on public.automotive_map_features (source_id)
  where source_id is not null;

insert into public.automotive_map_sources (
  name, source_type, base_url, country_code, trust_level, active, notes, verified_at
)
select 'PistaPark Go Kart Chania', 'official_venue', 'https://gokartchania.com/', 'GR', 'high', true,
       'Official venue website verified for NOXA Map Content Expansion automation on 2026-09-08.', now()
where not exists (
  select 1 from public.automotive_map_sources
  where lower(regexp_replace(base_url, '^https?://(www\\.)?', '')) like 'gokartchania.com%'
);

insert into public.automotive_map_sources (
  name, source_type, base_url, country_code, trust_level, active, notes, verified_at
)
select 'Messara Kart', 'official_venue', 'https://messarakart.gr/', 'GR', 'high', true,
       'Official venue website verified for NOXA Map Content Expansion automation on 2026-09-08.', now()
where not exists (
  select 1 from public.automotive_map_sources
  where lower(regexp_replace(base_url, '^https?://(www\\.)?', '')) like 'messarakart.gr%'
);

insert into public.automotive_map_sources (
  name, source_type, base_url, country_code, trust_level, active, notes, verified_at
)
select 'Go Kart Malia', 'official_venue', 'https://www.gokartmalia.gr/', 'GR', 'high', true,
       'Official venue website verified for NOXA Map Content Expansion automation on 2026-09-08.', now()
where not exists (
  select 1 from public.automotive_map_sources
  where lower(regexp_replace(base_url, '^https?://(www\\.)?', '')) like 'gokartmalia.gr%'
);

create or replace function private.automotive_map_automation_issues(target public.automotive_map_candidates)
returns text[]
language plpgsql
stable
set search_path = public, private
as $$
declare
  issues text[] := array[]::text[];
begin
  if target.automation_origin not in ('source_registry', 'osm_discovery') then
    issues := array_append(issues, 'not_automation_candidate');
  end if;
  if target.verification_confidence is null or target.verification_confidence < 0.98 then
    issues := array_append(issues, 'automation_confidence_too_low');
  end if;
  if target.verification_attempted_at is null then
    issues := array_append(issues, 'verification_not_attempted');
  end if;
  if target.geometry_source_url is null or target.geometry_source_url !~* '^https?://[^[:space:]]+$' then
    issues := array_append(issues, 'missing_geometry_evidence');
  end if;
  return issues;
end;
$$;

create or replace function private.automotive_map_duplicate_feature_id(target public.automotive_map_candidates)
returns uuid
language sql
stable
set search_path = public, private
as $$
  select f.id
  from public.automotive_map_features f
  where f.status = 'published'
    and f.feature_type = target.feature_type
    and (
      (target.source_id is not null and f.source_id = target.source_id)
      or lower(regexp_replace(btrim(f.title), '[^[:alnum:]]+', '', 'g')) =
         lower(regexp_replace(btrim(target.title), '[^[:alnum:]]+', '', 'g'))
      or (
        target.latitude is not null and target.longitude is not null
        and f.latitude is not null and f.longitude is not null
        and coalesce(f.feature_subtype, '') = coalesce(target.feature_subtype, '')
        and abs(f.latitude - target.latitude) <= 0.0025
        and abs(f.longitude - target.longitude) <= 0.0035
      )
    )
  order by
    case when target.source_id is not null and f.source_id = target.source_id then 0 else 1 end,
    f.created_at asc
  limit 1;
$$;

create or replace function private.automotive_map_auto_publish_verified(p_limit integer default 12)
returns table (
  candidate_id uuid,
  outcome text,
  feature_id uuid,
  reason text
)
language plpgsql
security definer
set search_path = public, private
as $$
declare
  candidate_row public.automotive_map_candidates%rowtype;
  issues text[];
  automation_issues text[];
  duplicate_id uuid;
  published_id uuid;
  block_text text;
begin
  for candidate_row in
    select c.*
    from public.automotive_map_candidates c
    join public.automotive_map_sources s on s.id = c.source_id
    where c.status = 'verified'
      and c.published_feature_id is null
      and c.automation_origin in ('source_registry', 'osm_discovery')
      and coalesce(c.verification_confidence, 0) >= 0.98
      and c.verification_attempted_at is not null
      and c.auto_publish_outcome is distinct from 'published'
      and s.active = true
      and s.trust_level in ('high', 'medium')
    order by c.created_at asc
    limit greatest(1, least(coalesce(p_limit, 12), 30))
  loop
    begin
      issues := private.automotive_map_candidate_quality_issues(candidate_row);
      automation_issues := private.automotive_map_automation_issues(candidate_row);
      duplicate_id := private.automotive_map_duplicate_feature_id(candidate_row);
      block_text := null;

      if cardinality(issues) > 0 then
        block_text := 'Quality Gate: ' || array_to_string(issues, ',');
      elsif cardinality(automation_issues) > 0 then
        block_text := 'Automation Gate: ' || array_to_string(automation_issues, ',');
      elsif duplicate_id is not null then
        block_text := 'Duplicate published map feature: ' || duplicate_id::text;
      end if;

      if block_text is not null then
        update public.automotive_map_candidates
        set status = 'blocked',
            block_reason = left(block_text, 1500),
            auto_publish_outcome = case when duplicate_id is not null then 'duplicate' else 'blocked' end,
            auto_publish_reason = left(block_text, 1500),
            auto_publish_attempted_at = now(),
            updated_at = now()
        where id = candidate_row.id and status = 'verified';

        candidate_id := candidate_row.id;
        outcome := case when duplicate_id is not null then 'duplicate' else 'blocked' end;
        feature_id := duplicate_id;
        reason := block_text;
        return next;
        continue;
      end if;

      published_id := private.publish_automotive_map_candidate(candidate_row.id);

      update public.automotive_map_candidates
      set auto_publish_outcome = 'published',
          auto_publish_reason = 'Automatically published after source, geometry, access, dedupe and Quality Gate verification.',
          auto_publish_attempted_at = now(),
          auto_published_at = now(),
          updated_at = now()
      where id = candidate_row.id;

      candidate_id := candidate_row.id;
      outcome := 'published';
      feature_id := published_id;
      reason := 'Verified map candidate automatically published.';
      return next;
    exception when others then
      update public.automotive_map_candidates
      set auto_publish_outcome = 'failed',
          auto_publish_reason = left('Auto-publish failed: ' || sqlerrm, 1500),
          auto_publish_attempted_at = now(),
          updated_at = now()
      where id = candidate_row.id;

      candidate_id := candidate_row.id;
      outcome := 'failed';
      feature_id := null;
      reason := left(sqlerrm, 1500);
      return next;
    end;
  end loop;
end;
$$;

revoke all on function private.automotive_map_automation_issues(public.automotive_map_candidates) from public;
revoke all on function private.automotive_map_duplicate_feature_id(public.automotive_map_candidates) from public;
revoke all on function private.automotive_map_auto_publish_verified(integer) from public;

-- A single low-frequency discovery pass is intentional. Map content changes much more slowly than events.
do $$
declare existing_job bigint;
begin
  select jobid into existing_job from cron.job where jobname = 'automotive-map-collector-daily' limit 1;
  if existing_job is not null then perform cron.unschedule(existing_job); end if;

  select jobid into existing_job from cron.job where jobname = 'automotive-map-auto-publisher-daily' limit 1;
  if existing_job is not null then perform cron.unschedule(existing_job); end if;
end $$;

select cron.schedule(
  'automotive-map-collector-daily',
  '11 2 * * *',
  $job$
    select net.http_post(
      url := 'https://qrouwtqsqrfeeeppyeru.supabase.co/functions/v1/automotive-map-collector',
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
  $job$
);

select cron.schedule(
  'automotive-map-auto-publisher-daily',
  '31 2 * * *',
  $job$
    select * from private.automotive_map_auto_publish_verified(12);
  $job$
);

-- Dedicated fail-closed route pipeline.
-- Reuses automotive_map_sources/candidates, the existing Quality Gate and auto-publisher.
-- Visit Greece (GNTO) is a high-trust tourism authority. Route geometry must still
-- come from an official page-linked KML and pass candidate verification.

insert into public.automotive_map_sources (
  name,
  source_type,
  base_url,
  country_code,
  trust_level,
  active,
  notes,
  verified_at
)
select
  'Visit Greece (GNTO)',
  'tourism_authority',
  'https://www.visitgreece.gr/',
  'GR',
  'high',
  true,
  'Official Greek National Tourism Organisation source. Route publication requires authoritative official KML geometry and explicit Road-route evidence.',
  now()
where not exists (
  select 1
  from public.automotive_map_sources
  where lower(regexp_replace(base_url, '/+$', '')) = 'https://www.visitgreece.gr'
);

do $$
declare existing_job bigint;
begin
  select jobid into existing_job
  from cron.job
  where jobname = 'automotive-route-collector-daily'
  limit 1;

  if existing_job is not null then
    perform cron.unschedule(existing_job);
  end if;
end $$;

select cron.schedule(
  'automotive-route-collector-daily',
  '21 2 * * *',
  $job$
    select net.http_post(
      url := 'https://qrouwtqsqrfeeeppyeru.supabase.co/functions/v1/automotive-route-collector',
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
      body := '{"mode":"scheduled"}'::jsonb,
      timeout_milliseconds := 60000
    );
  $job$
);

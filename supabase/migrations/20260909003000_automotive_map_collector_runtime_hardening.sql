-- Runtime hardening for the daily automotive map collector.
-- The collector performs external source verification and Overpass discovery, so pg_net's 5s default is too short.

do $$
declare existing_job bigint;
begin
  select jobid into existing_job
  from cron.job
  where jobname = 'automotive-map-collector-daily'
  limit 1;

  if existing_job is not null then
    perform cron.unschedule(existing_job);
  end if;
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
      body := '{"mode":"scheduled"}'::jsonb,
      timeout_milliseconds := 60000
    );
  $job$
);
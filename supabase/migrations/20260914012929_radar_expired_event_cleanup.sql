-- Automatically remove completed public events from NOXA Radar.
-- Keep lifecycle semantics aligned with src/lib/meets/eventVisibility.ts:
-- when ends_at is missing, an event is considered complete three hours after starts_at.

create or replace function private.radar_delete_expired_events(p_now timestamptz default now())
returns table (
  event_id uuid,
  candidate_id uuid,
  public_slug text
)
language plpgsql
security definer
set search_path = public, private
as $$
begin
  return query
  with expired as (
    select e.id, e.candidate_id, e.public_slug
    from public.radar_events e
    where e.status = 'published'
      and coalesce(e.ends_at, e.starts_at + interval '3 hours') < p_now
    for update skip locked
  ),
  deleted_events as (
    delete from public.radar_events e
    using expired x
    where e.id = x.id
    returning e.id, e.candidate_id, e.public_slug
  ),
  deleted_candidates as (
    delete from public.radar_candidates c
    using (
      select distinct de.candidate_id
      from deleted_events de
      where de.candidate_id is not null
    ) d
    where c.id = d.candidate_id
      and not exists (
        select 1
        from public.radar_events remaining
        where remaining.candidate_id = c.id
      )
    returning c.id
  )
  select de.id, de.candidate_id, de.public_slug
  from deleted_events de
  left join deleted_candidates dc on dc.id = de.candidate_id;
end;
$$;

revoke all on function private.radar_delete_expired_events(timestamptz) from public;

do $$
declare
  existing_job bigint;
begin
  select jobid into existing_job
  from cron.job
  where jobname = 'radar-expired-event-cleanup-hourly'
  limit 1;

  if existing_job is not null then
    perform cron.unschedule(existing_job);
  end if;

  perform cron.schedule(
    'radar-expired-event-cleanup-hourly',
    '7 * * * *',
    $cron$
      select * from private.radar_delete_expired_events(now());
    $cron$
  );
end $$;

-- Reconcile existing stale production data immediately when the migration is applied.
select * from private.radar_delete_expired_events(now());

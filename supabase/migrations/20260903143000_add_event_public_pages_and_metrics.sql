-- Website-only public event pages and organizer metrics.

alter table public.radar_events
  add column if not exists public_slug text;

update public.radar_events
set public_slug = trim(both '-' from regexp_replace(lower(title), '[^a-z0-9]+', '-', 'g')) || '-' || left(id::text, 8)
where public_slug is null;

update public.radar_events
set public_slug = 'event-' || left(id::text, 8)
where public_slug is null or char_length(public_slug) < 3;

alter table public.radar_events
  alter column public_slug set not null;

create unique index if not exists radar_events_public_slug_key
  on public.radar_events (public_slug);

create or replace function public.set_radar_event_public_slug()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  base_slug text;
begin
  if new.public_slug is not null and char_length(new.public_slug) >= 3 then
    return new;
  end if;

  base_slug := trim(both '-' from regexp_replace(lower(coalesce(new.title, 'event')), '[^a-z0-9]+', '-', 'g'));
  if char_length(base_slug) < 2 then
    base_slug := 'event';
  end if;

  new.public_slug := left(base_slug, 72) || '-' || left(new.id::text, 8);
  return new;
end;
$$;

drop trigger if exists set_radar_event_public_slug on public.radar_events;
create trigger set_radar_event_public_slug
before insert on public.radar_events
for each row execute function public.set_radar_event_public_slug();

create table if not exists public.event_metrics_daily (
  event_id uuid not null references public.radar_events(id) on delete cascade,
  metric_date date not null default current_date,
  views integer not null default 0 check (views >= 0),
  shares integer not null default 0 check (shares >= 0),
  map_clicks integer not null default 0 check (map_clicks >= 0),
  source_noxa integer not null default 0 check (source_noxa >= 0),
  source_instagram integer not null default 0 check (source_instagram >= 0),
  source_google integer not null default 0 check (source_google >= 0),
  source_facebook integer not null default 0 check (source_facebook >= 0),
  source_tiktok integer not null default 0 check (source_tiktok >= 0),
  source_direct integer not null default 0 check (source_direct >= 0),
  source_other integer not null default 0 check (source_other >= 0),
  updated_at timestamptz not null default now(),
  primary key (event_id, metric_date)
);

create index if not exists event_metrics_daily_date_idx
  on public.event_metrics_daily (metric_date desc);

create table if not exists public.event_metric_rate_limits (
  event_id uuid not null references public.radar_events(id) on delete cascade,
  fingerprint_hash text not null,
  metric_kind text not null check (metric_kind in ('view', 'share', 'map_click')),
  bucket_start timestamptz not null,
  created_at timestamptz not null default now(),
  primary key (event_id, fingerprint_hash, metric_kind, bucket_start)
);

create index if not exists event_metric_rate_limits_created_idx
  on public.event_metric_rate_limits (created_at);

alter table public.event_metrics_daily enable row level security;
alter table public.event_metric_rate_limits enable row level security;

revoke all on table public.event_metrics_daily from anon, authenticated;
revoke all on table public.event_metric_rate_limits from anon, authenticated;
grant select on table public.event_metrics_daily to authenticated;

create policy "organizers read own event metrics"
  on public.event_metrics_daily
  for select
  to authenticated
  using (
    private.is_radar_admin()
    or exists (
      select 1
      from public.radar_events e
      where e.id = event_metrics_daily.event_id
        and e.organizer_profile_id is not null
        and private.is_verified_organizer_admin(e.organizer_profile_id)
    )
  );

create or replace function public.record_event_metric(
  p_event_id uuid,
  p_kind text,
  p_source text default 'direct'
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  source_column text;
begin
  if p_kind not in ('view', 'share', 'map_click') then
    raise exception 'Invalid metric kind' using errcode = '22023';
  end if;

  if not exists (
    select 1 from public.radar_events
    where id = p_event_id and status = 'published'
  ) then
    return false;
  end if;

  source_column := case p_source
    when 'noxa' then 'source_noxa'
    when 'instagram' then 'source_instagram'
    when 'google' then 'source_google'
    when 'facebook' then 'source_facebook'
    when 'tiktok' then 'source_tiktok'
    when 'direct' then 'source_direct'
    else 'source_other'
  end;

  insert into public.event_metrics_daily (event_id, metric_date)
  values (p_event_id, current_date)
  on conflict (event_id, metric_date) do nothing;

  if p_kind = 'view' then
    execute format(
      'update public.event_metrics_daily set views = views + 1, %I = %I + 1, updated_at = now() where event_id = $1 and metric_date = current_date',
      source_column,
      source_column
    ) using p_event_id;
  elsif p_kind = 'share' then
    update public.event_metrics_daily
    set shares = shares + 1, updated_at = now()
    where event_id = p_event_id and metric_date = current_date;
  else
    update public.event_metrics_daily
    set map_clicks = map_clicks + 1, updated_at = now()
    where event_id = p_event_id and metric_date = current_date;
  end if;

  return true;
end;
$$;

revoke execute on function public.record_event_metric(uuid, text, text) from public, anon, authenticated;
grant execute on function public.record_event_metric(uuid, text, text) to service_role;

comment on column public.radar_events.public_slug is
  'Stable public URL slug for NOXA Meets event pages.';

comment on table public.event_metrics_daily is
  'Daily aggregate event analytics visible only to NOXA admins and the verified organizer that owns the event.';

comment on table public.event_metric_rate_limits is
  'Hashed short-lived deduplication buckets for anonymous event analytics. Raw IP addresses are never stored.';

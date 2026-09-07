alter table public.radar_events
  add column if not exists cover_image_url text,
  add column if not exists cover_image_source_url text,
  add column if not exists cover_image_alt text,
  add column if not exists latitude double precision,
  add column if not exists longitude double precision,
  add column if not exists location_precision text not null default 'unknown';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'radar_events_latitude_check'
  ) then
    alter table public.radar_events
      add constraint radar_events_latitude_check
      check (latitude is null or latitude between -90 and 90);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'radar_events_longitude_check'
  ) then
    alter table public.radar_events
      add constraint radar_events_longitude_check
      check (longitude is null or longitude between -180 and 180);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'radar_events_coordinate_pair_check'
  ) then
    alter table public.radar_events
      add constraint radar_events_coordinate_pair_check
      check ((latitude is null) = (longitude is null));
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'radar_events_location_precision_check'
  ) then
    alter table public.radar_events
      add constraint radar_events_location_precision_check
      check (location_precision in ('unknown', 'approximate', 'exact'));
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'radar_events_exact_location_requires_coordinates_check'
  ) then
    alter table public.radar_events
      add constraint radar_events_exact_location_requires_coordinates_check
      check (location_precision <> 'exact' or (latitude is not null and longitude is not null));
  end if;
end $$;

comment on column public.radar_events.cover_image_url is 'Event-specific cover image URL. Leave null when no verified event image is available.';
comment on column public.radar_events.cover_image_source_url is 'Source page for the event-specific cover image.';
comment on column public.radar_events.cover_image_alt is 'Accessible description for the event-specific cover image.';
comment on column public.radar_events.location_precision is 'unknown, approximate, or exact. Map actions must only use exact coordinates.';

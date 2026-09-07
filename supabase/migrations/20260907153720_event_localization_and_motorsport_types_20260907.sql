alter table public.radar_events
  add column if not exists title_el text,
  add column if not exists summary_el text,
  add column if not exists location_text_el text,
  add column if not exists cover_image_alt_el text;

alter table public.radar_events
  drop constraint if exists radar_events_event_type_check;

alter table public.radar_events
  add constraint radar_events_event_type_check
  check (event_type = any (array[
    'car_meet'::text,
    'moto_meet'::text,
    'track_day'::text,
    'drag'::text,
    'drift'::text,
    'rally'::text,
    'show'::text,
    'cars_and_coffee'::text,
    'group_drive'::text,
    'festival'::text,
    'karting'::text,
    'dexterity'::text,
    'other'::text
  ]));

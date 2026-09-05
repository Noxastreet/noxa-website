-- NOXA Meets growth features: discovery, follows, corrections and commercial badges.
-- Applied to website Supabase project qrouwtqsqrfeeeppyeru as migration
-- meets_growth_features_20260905.

alter table public.radar_events
  add column if not exists featured boolean not null default false,
  add column if not exists partner_badge text;

alter table public.organizer_profiles
  add column if not exists partner boolean not null default false,
  add column if not exists partner_label text;

create table if not exists public.meet_follow_subscriptions (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  target_type text not null check (target_type in ('city', 'organizer')),
  target_key text not null,
  target_label text not null,
  locale text not null default 'en' check (locale in ('en', 'el')),
  consent boolean not null default true,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (email, target_type, target_key)
);

create index if not exists meet_follow_subscriptions_target_idx
  on public.meet_follow_subscriptions (target_type, target_key)
  where active = true;

alter table public.meet_follow_subscriptions enable row level security;
revoke all on table public.meet_follow_subscriptions from anon, authenticated;
grant insert on table public.meet_follow_subscriptions to anon, authenticated;
grant all on table public.meet_follow_subscriptions to service_role;

drop policy if exists "public can create follow subscriptions" on public.meet_follow_subscriptions;
create policy "public can create follow subscriptions"
  on public.meet_follow_subscriptions
  for insert
  to anon, authenticated
  with check (consent = true and active = true);

create table if not exists public.event_correction_reports (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.radar_events(id) on delete cascade,
  reason text not null check (reason in ('time', 'location', 'cancelled', 'duplicate', 'other')),
  details text,
  email text,
  status text not null default 'new' check (status in ('new', 'reviewing', 'resolved', 'dismissed')),
  created_at timestamptz not null default now()
);

create index if not exists event_correction_reports_event_idx
  on public.event_correction_reports (event_id, created_at desc);

alter table public.event_correction_reports enable row level security;
revoke all on table public.event_correction_reports from anon, authenticated;
grant insert on table public.event_correction_reports to anon, authenticated;
grant all on table public.event_correction_reports to service_role;

drop policy if exists "public can submit event corrections" on public.event_correction_reports;
create policy "public can submit event corrections"
  on public.event_correction_reports
  for insert
  to anon, authenticated
  with check (status = 'new');

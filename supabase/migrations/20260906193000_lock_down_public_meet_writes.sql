-- Route public Meet writes through the validated/rate-limited meet-public Edge Function.
-- The service-role Edge Function bypasses RLS; browser/anon clients must not insert directly.

drop policy if exists "public can create follow subscriptions" on public.meet_follow_subscriptions;
drop policy if exists "public can submit event corrections" on public.event_correction_reports;

revoke insert on table public.meet_follow_subscriptions from anon, authenticated;
revoke insert on table public.event_correction_reports from anon, authenticated;

comment on table public.meet_follow_subscriptions is
  'Meet follow subscriptions. Public writes are accepted only through the meet-public Edge Function.';

comment on table public.event_correction_reports is
  'Public event correction reports. Public writes are accepted only through the meet-public Edge Function.';

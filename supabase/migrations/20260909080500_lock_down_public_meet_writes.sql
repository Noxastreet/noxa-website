-- Reliability Gate P0: route public Meet writes only through the validated/rate-limited meet-public Edge Function.
-- The service-role Edge Function bypasses RLS; browser/anon clients must not insert directly.

DROP POLICY IF EXISTS "public can create follow subscriptions" ON public.meet_follow_subscriptions;
DROP POLICY IF EXISTS "public can submit event corrections" ON public.event_correction_reports;

REVOKE INSERT ON TABLE public.meet_follow_subscriptions FROM anon, authenticated;
REVOKE INSERT ON TABLE public.event_correction_reports FROM anon, authenticated;

COMMENT ON TABLE public.meet_follow_subscriptions IS
  'Meet follow subscriptions. Public writes are accepted only through the meet-public Edge Function.';

COMMENT ON TABLE public.event_correction_reports IS
  'Public event correction reports. Public writes are accepted only through the meet-public Edge Function.';

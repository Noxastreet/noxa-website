-- Public organizer applications are inserted only by the hardened Edge Function.
-- Browser-authenticated users need read/update/delete only when RLS confirms NOXA admin access.
revoke insert, truncate, references, trigger on table public.organizer_applications from authenticated;
revoke all on table public.organizer_application_rate_limits from anon, authenticated;

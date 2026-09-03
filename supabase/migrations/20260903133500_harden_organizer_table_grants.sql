-- Tighten organizer table grants after enabling RLS.
-- RLS remains the authorization layer, while table grants expose only the operations each role actually needs.

revoke all on table public.organizer_profiles from anon, authenticated;
grant select on table public.organizer_profiles to anon;
grant select, insert, update, delete on table public.organizer_profiles to authenticated;

revoke all on table public.organizer_admins from anon, authenticated;
grant select, insert, update, delete on table public.organizer_admins to authenticated;

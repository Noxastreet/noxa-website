-- Consolidate organizer/event write policies and cover the new invitation foreign key.

create index if not exists organizer_invites_invited_by_idx
  on public.organizer_invites (invited_by)
  where invited_by is not null;

drop policy if exists "noxa admins insert organizer memberships" on public.organizer_admins;
drop policy if exists "invited users claim organizer memberships" on public.organizer_admins;

create policy "authorized inserts organizer memberships"
  on public.organizer_admins
  for insert
  to authenticated
  with check (
    private.is_radar_admin()
    or (
      user_id = (select auth.uid())
      and status = 'active'
      and exists (
        select 1
        from public.organizer_invites oi
        where oi.organizer_id = organizer_admins.organizer_id
          and oi.role = organizer_admins.role
          and oi.status = 'pending'
          and oi.expires_at > now()
          and lower(oi.email) = lower(coalesce((select auth.jwt()) ->> 'email', ''))
      )
    )
  );

drop policy if exists "noxa admins insert radar events" on public.radar_events;
drop policy if exists "verified organizer admins insert own events" on public.radar_events;

create policy "authorized inserts radar events"
  on public.radar_events
  for insert
  to authenticated
  with check (
    private.is_radar_admin()
    or (
      organizer_profile_id is not null
      and private.is_verified_organizer_admin(organizer_profile_id)
      and publication_source = 'organizer'
      and candidate_id is null
    )
  );

drop policy if exists "noxa admins update radar events" on public.radar_events;
drop policy if exists "verified organizer admins update own events" on public.radar_events;

create policy "authorized updates radar events"
  on public.radar_events
  for update
  to authenticated
  using (
    private.is_radar_admin()
    or (
      organizer_profile_id is not null
      and private.is_verified_organizer_admin(organizer_profile_id)
      and publication_source = 'organizer'
      and candidate_id is null
    )
  )
  with check (
    private.is_radar_admin()
    or (
      organizer_profile_id is not null
      and private.is_verified_organizer_admin(organizer_profile_id)
      and publication_source = 'organizer'
      and candidate_id is null
    )
  );

-- Community moderation RPCs run as the signed-in caller.
-- Existing RLS plus the explicit NOXA-admin check remain the authorization boundary.

create or replace function public.approve_community_application(
  p_application_id uuid,
  p_slug text,
  p_mark_verified boolean default false
)
returns jsonb
language plpgsql
security invoker
set search_path = public, private
as $$
declare
  application_row public.community_applications%rowtype;
  new_community_id uuid;
  new_organizer_id uuid;
  normalized_slug text := lower(btrim(p_slug));
begin
  if not private.is_radar_admin() then
    raise exception 'Not authorized' using errcode = '42501';
  end if;

  if normalized_slug is null
     or char_length(normalized_slug) < 2
     or char_length(normalized_slug) > 80
     or normalized_slug !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' then
    raise exception 'Invalid community slug' using errcode = '22023';
  end if;

  select *
  into application_row
  from public.community_applications
  where id = p_application_id
  for update;

  if not found then
    raise exception 'Application not found' using errcode = 'P0002';
  end if;

  if application_row.status <> 'pending' then
    raise exception 'Application already reviewed' using errcode = '22023';
  end if;

  insert into public.communities (
    slug, name, description, city, region, country_code, focus, scene_tags,
    instagram_url, website_url, verified, status, published_at
  ) values (
    normalized_slug, application_row.community_name, application_row.about,
    application_row.city, application_row.region, application_row.country_code,
    application_row.focus, application_row.scene_tags, application_row.instagram_url,
    application_row.website_url, p_mark_verified, 'published', now()
  )
  returning id into new_community_id;

  insert into public.organizer_profiles (
    slug, name, organizer_type, community_id, city, country_code,
    instagram_url, website_url, verified, status
  ) values (
    normalized_slug, application_row.community_name, 'community', new_community_id,
    application_row.city, application_row.country_code, application_row.instagram_url,
    application_row.website_url, p_mark_verified, 'active'
  )
  returning id into new_organizer_id;

  update public.community_applications
  set status = 'approved',
      reviewed_by = auth.uid(),
      reviewed_at = now(),
      updated_at = now()
  where id = p_application_id;

  return jsonb_build_object(
    'ok', true,
    'community_id', new_community_id,
    'organizer_id', new_organizer_id,
    'verified', p_mark_verified
  );
end;
$$;

create or replace function public.reject_community_application(
  p_application_id uuid,
  p_notes text default null
)
returns boolean
language plpgsql
security invoker
set search_path = public, private
as $$
begin
  if not private.is_radar_admin() then
    raise exception 'Not authorized' using errcode = '42501';
  end if;

  update public.community_applications
  set status = 'rejected',
      review_notes = nullif(left(btrim(coalesce(p_notes, '')), 1200), ''),
      reviewed_by = auth.uid(),
      reviewed_at = now(),
      updated_at = now()
  where id = p_application_id
    and status = 'pending';

  if not found then
    raise exception 'Pending application not found' using errcode = 'P0002';
  end if;

  return true;
end;
$$;

revoke execute on function public.approve_community_application(uuid, text, boolean) from public, anon;
revoke execute on function public.reject_community_application(uuid, text) from public, anon;
grant execute on function public.approve_community_application(uuid, text, boolean) to authenticated;
grant execute on function public.reject_community_application(uuid, text) to authenticated;

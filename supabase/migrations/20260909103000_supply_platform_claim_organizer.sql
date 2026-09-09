-- Supply Platform P1: let a representative claim an existing NOXA Organizer profile.
-- Claims remain fail-closed: they require NOXA admin review before any owner invite is created.

alter table public.organizer_applications
  add column if not exists application_kind text not null default 'new';

alter table public.organizer_applications
  add column if not exists claimed_organizer_id uuid references public.organizer_profiles(id) on delete set null;

alter table public.organizer_applications
  drop constraint if exists organizer_applications_application_kind_check;

alter table public.organizer_applications
  add constraint organizer_applications_application_kind_check
  check (application_kind in ('new', 'claim'));

alter table public.organizer_applications
  drop constraint if exists organizer_applications_claim_target_check;

alter table public.organizer_applications
  add constraint organizer_applications_claim_target_check
  check (
    (application_kind = 'new' and claimed_organizer_id is null)
    or
    (application_kind = 'claim' and claimed_organizer_id is not null)
  );

create index if not exists organizer_applications_claim_target_idx
  on public.organizer_applications (claimed_organizer_id, status, created_at desc)
  where claimed_organizer_id is not null;

create unique index if not exists organizer_applications_pending_claim_email_idx
  on public.organizer_applications (claimed_organizer_id, lower(contact_email))
  where application_kind = 'claim' and status = 'pending';

create or replace function public.approve_organizer_application(
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
  application_row public.organizer_applications%rowtype;
  target_organizer public.organizer_profiles%rowtype;
  new_organizer_id uuid;
  normalized_slug text := lower(btrim(coalesce(p_slug, '')));
begin
  if not private.is_radar_admin() then
    raise exception 'Not authorized' using errcode = '42501';
  end if;

  select * into application_row
  from public.organizer_applications
  where id = p_application_id
  for update;

  if not found then
    raise exception 'Application not found' using errcode = 'P0002';
  end if;

  if application_row.status <> 'pending' then
    raise exception 'Application already reviewed' using errcode = '22023';
  end if;

  if application_row.application_kind = 'claim' then
    select * into target_organizer
    from public.organizer_profiles
    where id = application_row.claimed_organizer_id
      and status = 'active'
      and verified = true
    for update;

    if not found then
      raise exception 'Claim target is not an active verified organizer' using errcode = '22023';
    end if;

    insert into public.organizer_invites (
      organizer_id,
      email,
      role,
      status,
      invited_by,
      expires_at
    )
    values (
      target_organizer.id,
      lower(application_row.contact_email),
      'owner',
      'pending',
      auth.uid(),
      now() + interval '30 days'
    )
    on conflict do nothing;

    update public.organizer_applications
    set status = 'approved', reviewed_by = auth.uid(), reviewed_at = now(), updated_at = now()
    where id = p_application_id;

    return jsonb_build_object(
      'ok', true,
      'claim', true,
      'organizer_id', target_organizer.id,
      'email', lower(application_row.contact_email),
      'verified', target_organizer.verified
    );
  end if;

  if normalized_slug = ''
     or char_length(normalized_slug) < 2
     or char_length(normalized_slug) > 80
     or normalized_slug !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' then
    raise exception 'Invalid organizer slug' using errcode = '22023';
  end if;

  insert into public.organizer_profiles (
    slug,
    name,
    organizer_type,
    community_id,
    city,
    country_code,
    instagram_url,
    website_url,
    verified,
    status
  )
  values (
    normalized_slug,
    application_row.organizer_name,
    application_row.organizer_type,
    null,
    application_row.city,
    application_row.country_code,
    application_row.instagram_url,
    application_row.website_url,
    p_mark_verified,
    'active'
  )
  returning id into new_organizer_id;

  insert into public.organizer_invites (
    organizer_id,
    email,
    role,
    status,
    invited_by,
    expires_at
  )
  values (
    new_organizer_id,
    lower(application_row.contact_email),
    'owner',
    'pending',
    auth.uid(),
    now() + interval '30 days'
  );

  update public.organizer_applications
  set status = 'approved', reviewed_by = auth.uid(), reviewed_at = now(), updated_at = now()
  where id = p_application_id;

  return jsonb_build_object(
    'ok', true,
    'claim', false,
    'organizer_id', new_organizer_id,
    'email', lower(application_row.contact_email),
    'verified', p_mark_verified
  );
end;
$$;

revoke execute on function public.approve_organizer_application(uuid, text, boolean) from public, anon;
grant execute on function public.approve_organizer_application(uuid, text, boolean) to authenticated;

comment on column public.organizer_applications.application_kind is
  'new creates a reviewed organizer identity; claim requests owner access to an existing verified organizer profile.';
comment on column public.organizer_applications.claimed_organizer_id is
  'Existing organizer profile requested by a claim application. Access is granted only after NOXA admin approval.';

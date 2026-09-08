-- Allow the existing automotive map Quality Gate trigger to call private helper functions
-- when updates arrive through the service-role PostgREST path used by the collector.
-- Keep the private schema closed: the trigger executes with its owner privileges instead
-- of granting service_role/public direct access to private functions.

create or replace function private.enforce_automotive_map_candidate_quality()
returns trigger
language plpgsql
security definer
set search_path = public, private
as $$
declare
  issues text[];
begin
  if new.status in ('verified', 'published') then
    issues := private.automotive_map_candidate_quality_issues(new);
    if cardinality(issues) > 0 then
      raise exception 'AUTOMOTIVE_MAP_CANDIDATE_QUALITY_GATE:%', array_to_string(issues, ',')
        using errcode = '23514';
    end if;
  end if;

  if new.status = 'blocked' and coalesce(btrim(new.block_reason), '') = '' then
    raise exception 'AUTOMOTIVE_MAP_CANDIDATE_BLOCK_REASON_REQUIRED'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

revoke all on function private.enforce_automotive_map_candidate_quality() from public;

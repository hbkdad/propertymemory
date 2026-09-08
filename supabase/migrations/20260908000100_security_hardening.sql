-- Follow-up to 20260908000000_init_schema.sql, informed by Supabase's security
-- advisor run against the real project immediately after that migration.
-- Never edit an applied migration (CLAUDE.md rule) -- fix forward instead.

-- 1. set_updated_at() had no pinned search_path. Low actual risk (it only
-- assigns NEW.updated_at, no dynamic SQL or unqualified lookups), but every
-- function should follow the same hardening pattern as the others for
-- consistency and to close the advisor's function_search_path_mutable warning.
create or replace function set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- 2. is_org_member / is_org_admin / create_organization were meant to be
-- authenticated-only. The original migration ran `revoke all ... from public`,
-- which does NOT remove Supabase's project-level default grant of EXECUTE
-- directly to the `anon` role (that grant was never "from public" to begin
-- with -- it's a separate direct grant) -- so `anon` could still call all
-- three. Confirmed via get_advisors immediately after applying the original
-- migration. Revoking from `anon` explicitly closes this.
--
-- Actual exploitability was already zero for create_organization specifically
-- (it raises an exception when auth.uid() is null, which is always true for
-- `anon`) -- this is exactly why that in-function check exists in addition to
-- grants: the grant hardening had a gap, and the function-level check caught
-- it anyway. is_org_member/is_org_admin were harmless either way (they only
-- ever answer "is auth.uid() a member of this org", which is false for
-- anon) but are tightened here too, on the same least-privilege principle.
revoke execute on function is_org_member(uuid) from anon;
revoke execute on function is_org_admin(uuid) from anon;
revoke execute on function create_organization(text) from anon;

-- handle_new_user() is a trigger function -- it should never be callable
-- directly via RPC at all (only the auth.users trigger should invoke it).
-- Revoking execute from every client-facing role doesn't affect the trigger
-- itself: trigger invocation isn't gated by the same EXECUTE grant as a
-- direct call.
revoke execute on function handle_new_user() from public, anon, authenticated;

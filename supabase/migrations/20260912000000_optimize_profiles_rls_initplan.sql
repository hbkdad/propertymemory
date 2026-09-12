-- Perf advisor: profiles_update_self called auth.uid() directly, which
-- Postgres re-evaluates for every row scanned by the update rather than
-- once per statement. Wrapping it in a scalar subquery lets the planner
-- treat it as an initplan (computed once) -- same semantics, since the
-- value never changes within one statement anyway, just cheaper at scale.
-- See https://supabase.com/docs/guides/database/postgres/row-level-security#call-functions-with-select
drop policy profiles_update_self on profiles;
create policy profiles_update_self on profiles for update
  using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

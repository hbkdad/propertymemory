-- Follow-up to 20260908000100_security_hardening.sql. Supabase's security
-- advisor flags pg_trgm living in the public schema (best practice is to
-- keep extensions out of public, since it's writable by more roles and
-- extension objects there are exposed to PostgREST by default). Moving it is
-- safe here: nothing in the app calls pg_trgm's functions/operators
-- directly, and the existing gin_trgm_ops indexes resolve their operator
-- class by OID, not by re-looking it up via search_path at query time -- so
-- the ilike-accelerating indexes created against it keep working unchanged.
create schema if not exists extensions;
alter extension pg_trgm set schema extensions;

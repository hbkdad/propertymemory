import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// getClaims() validates the JWT signature locally against the project's
// published keys -- it's the current Supabase-recommended way to check auth
// server-side. getSession() does not validate; getUser() works but makes a
// network round-trip getClaims() avoids. Cached per request via React's cache().
export const getAuthClaims = cache(async () => {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims) return null;
  return data.claims;
});

export const requireUser = cache(async () => {
  const claims = await getAuthClaims();
  if (!claims) redirect("/login");
  return claims;
});

// MVP assumption: a user belongs to exactly one organization (the one
// created during onboarding). The schema supports many-to-many via
// memberships, so this narrows rather than forecloses multi-org support.
export const getCurrentMembership = cache(async () => {
  const claims = await requireUser();
  const supabase = await createClient();
  const { data } = await supabase
    .from("memberships")
    .select("role, organizations(id, name)")
    .eq("user_id", claims.sub as string)
    .limit(1)
    .maybeSingle();
  return data;
});

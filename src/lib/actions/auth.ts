"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  forgotPasswordSchema,
  loginSchema,
  resetPasswordSchema,
  signUpSchema,
} from "@/lib/validations/auth";

export type AuthFormState =
  | { errors?: { email?: string[]; password?: string[] }; message?: string }
  | undefined;

async function siteOrigin() {
  return (await headers()).get("origin") ?? "http://localhost:3000";
}

export async function signUp(_state: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const validated = signUpSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: validated.data.email,
    password: validated.data.password,
    options: {
      // Just the bare origin -- the confirmation email template (see
      // supabase/templates/confirmation.html) appends /auth/confirm and the
      // fixed next=/onboarding destination itself.
      emailRedirectTo: await siteOrigin(),
    },
  });

  if (error) {
    return { message: error.message };
  }

  // Email confirmation is required by default: signUp creates the user but
  // returns no session until they click the confirmation link.
  if (!data.session) {
    return { message: "Check your email to confirm your account before logging in." };
  }

  redirect("/onboarding");
}

export async function logIn(_state: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const validated = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(validated.data);

  if (error) {
    return { message: "Incorrect email or password." };
  }

  redirect("/dashboard");
}

export async function logOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function requestPasswordReset(
  _state: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const validated = forgotPasswordSchema.safeParse({ email: formData.get("email") });
  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(validated.data.email, {
    // Bare origin -- see the signUp comment above; recovery.html appends
    // /auth/confirm and next=/reset-password itself.
    redirectTo: await siteOrigin(),
  });

  // Always return the same message whether or not the email exists, so this
  // endpoint can't be used to enumerate registered accounts.
  return { message: "If an account exists for that email, a reset link has been sent." };
}

export async function updatePassword(
  _state: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const validated = resetPasswordSchema.safeParse({ password: formData.get("password") });
  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: validated.data.password });

  if (error) {
    return { message: error.message };
  }

  redirect("/dashboard");
}

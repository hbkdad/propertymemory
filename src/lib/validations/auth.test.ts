import { describe, expect, it } from "vitest";
import { forgotPasswordSchema, loginSchema, resetPasswordSchema, signUpSchema } from "./auth";

describe("signUpSchema", () => {
  it("accepts a valid email and an 8+ char password", () => {
    const result = signUpSchema.safeParse({ email: "a@example.com", password: "password123" });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid email", () => {
    const result = signUpSchema.safeParse({ email: "not-an-email", password: "password123" });
    expect(result.success).toBe(false);
  });

  it("rejects a password shorter than 8 characters", () => {
    const result = signUpSchema.safeParse({ email: "a@example.com", password: "short" });
    expect(result.success).toBe(false);
  });
});

describe("loginSchema", () => {
  it("accepts any non-empty password (strength is enforced at signup, not login)", () => {
    const result = loginSchema.safeParse({ email: "a@example.com", password: "x" });
    expect(result.success).toBe(true);
  });

  it("rejects an empty password", () => {
    const result = loginSchema.safeParse({ email: "a@example.com", password: "" });
    expect(result.success).toBe(false);
  });
});

describe("forgotPasswordSchema", () => {
  it("requires a valid email", () => {
    expect(forgotPasswordSchema.safeParse({ email: "a@example.com" }).success).toBe(true);
    expect(forgotPasswordSchema.safeParse({ email: "nope" }).success).toBe(false);
  });
});

describe("resetPasswordSchema", () => {
  it("requires an 8+ char password", () => {
    expect(resetPasswordSchema.safeParse({ password: "password123" }).success).toBe(true);
    expect(resetPasswordSchema.safeParse({ password: "short" }).success).toBe(false);
  });
});

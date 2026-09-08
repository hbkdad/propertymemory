import { describe, expect, it } from "vitest";
import { onboardingSchema } from "./onboarding";

describe("onboardingSchema", () => {
  it("accepts the minimum required fields", () => {
    const result = onboardingSchema.safeParse({
      accountName: "The Lavigne Household",
      propertyName: "12 Main Street",
      propertyType: "single_family",
    });
    expect(result.success).toBe(true);
  });

  it("accepts optional address fields when provided", () => {
    const result = onboardingSchema.safeParse({
      accountName: "Acme Rentals",
      propertyName: "Unit 4B",
      propertyType: "multi_unit",
      addressLine1: "123 Oak Ave",
      city: "Ottawa",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a blank account name", () => {
    const result = onboardingSchema.safeParse({
      accountName: "   ",
      propertyName: "12 Main Street",
      propertyType: "single_family",
    });
    expect(result.success).toBe(false);
  });

  it("rejects an unknown property type", () => {
    const result = onboardingSchema.safeParse({
      accountName: "Acme",
      propertyName: "12 Main Street",
      propertyType: "castle",
    });
    expect(result.success).toBe(false);
  });
});

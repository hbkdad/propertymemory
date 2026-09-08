// Single source of truth for user-facing brand strings (ADR 0003). The name is
// a working title and WILL change -- nothing outside this file should contain
// a literal product name, so a rename is a one-line edit here, not a refactor.
export const branding = {
  productName: "HouseFile",
  shortTagline: "Your property remembers everything.",
  description:
    "The organized history of your home or rental property -- every appliance, repair, warranty, and receipt, searchable in one place.",
  supportEmail: "support@example.com",
} as const;

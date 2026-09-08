import { describe, expect, it } from "vitest";
import { advanceDueDate } from "./reminder";

describe("advanceDueDate", () => {
  it("advances weekly by 7 days", () => {
    expect(advanceDueDate("2026-09-08", "weekly")).toBe("2026-09-15");
  });

  it("advances monthly, quarterly, semiannual, and annual correctly", () => {
    expect(advanceDueDate("2026-09-08", "monthly")).toBe("2026-10-08");
    expect(advanceDueDate("2026-09-08", "quarterly")).toBe("2026-12-08");
    expect(advanceDueDate("2026-09-08", "semiannual")).toBe("2027-03-08");
    expect(advanceDueDate("2026-09-08", "annual")).toBe("2027-09-08");
  });

  it("clamps to the last day of the month instead of overflowing (Jan 31 + monthly)", () => {
    // Naive Date#setUTCMonth would roll Jan 31 + 1 month into March (Feb has
    // no 31st) -- silently skipping February's reminder entirely.
    expect(advanceDueDate("2026-01-31", "monthly")).toBe("2026-02-28");
  });

  it("clamps on a leap-year February", () => {
    expect(advanceDueDate("2028-01-31", "monthly")).toBe("2028-02-29");
  });
});

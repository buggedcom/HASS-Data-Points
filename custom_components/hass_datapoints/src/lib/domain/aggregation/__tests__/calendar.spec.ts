import { describe, expect, it } from "vitest";
import { getPeriods } from "@/lib/domain/aggregation/calendar";

const hours = (n: number) => n * 3600000;

describe("GIVEN a Europe/London spring-forward weekend", () => {
  describe("WHEN splitting the range into days", () => {
    it("THEN the 30 March 2025 day is 23 hours long", () => {
      expect.assertions(2);
      const periods = getPeriods(
        {
          start: Date.parse("2025-03-29T00:00:00Z"),
          end: Date.parse("2025-03-31T23:00:00Z"),
        },
        "day",
        "Europe/London"
      );
      expect(periods).toHaveLength(3);
      expect(periods[1].periodEnd - periods[1].periodStart).toBe(hours(23));
    });
  });
});

describe("GIVEN a New York autumn fall-back day", () => {
  describe("WHEN splitting the range into hours", () => {
    it("THEN the repeated hour yields distinct buckets for a 25-hour day", () => {
      expect.assertions(2);
      const start = Date.parse("2025-11-02T04:00:00Z");
      const periods = getPeriods(
        { start, end: start + hours(25) },
        "hour",
        "America/New_York"
      );
      expect(periods).toHaveLength(25);
      expect(new Set(periods.map((p) => p.start)).size).toBe(25);
    });
  });
});

describe("GIVEN a timezone different from UTC", () => {
  describe("WHEN splitting into days", () => {
    it("THEN day boundaries follow the configured timezone", () => {
      expect.assertions(1);
      const [first] = getPeriods(
        {
          start: Date.parse("2026-01-01T10:00:00Z"),
          end: Date.parse("2026-01-01T12:00:00Z"),
        },
        "day",
        "Australia/Sydney"
      );
      expect(first.periodStart).toBe(Date.parse("2025-12-31T13:00:00Z"));
    });
  });
});

describe("GIVEN a range starting on a Wednesday", () => {
  describe("WHEN splitting into weeks", () => {
    it("THEN weeks start on Monday and edge weeks are partial", () => {
      expect.assertions(3);
      const periods = getPeriods(
        {
          start: Date.parse("2026-01-07T00:00:00Z"),
          end: Date.parse("2026-01-14T00:00:00Z"),
        },
        "week",
        "UTC"
      );
      expect(periods[0].periodStart).toBe(Date.parse("2026-01-05T00:00:00Z"));
      expect(periods[0].partial).toBe(true);
      expect(periods).toHaveLength(2);
    });
  });
});

describe("GIVEN a range crossing February", () => {
  describe("WHEN splitting into months", () => {
    it("THEN February has 28 days in 2026", () => {
      expect.assertions(1);
      const periods = getPeriods(
        {
          start: Date.parse("2026-01-31T00:00:00Z"),
          end: Date.parse("2026-03-02T00:00:00Z"),
        },
        "month",
        "UTC"
      );
      expect(periods[1].periodEnd - periods[1].periodStart).toBe(
        28 * hours(24)
      );
    });
  });
});

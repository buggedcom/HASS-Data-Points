import { describe, expect, it } from "vitest";

import {
  addCalendarMonthsClamped,
  isRelativeDateWindowPreset,
  RELATIVE_DATE_WINDOW_PRESETS,
  type RelativeDateWindowPreset,
  relativeDateWindowPresetLabel,
  resolveRelativeDateWindow,
} from "@/lib/domain/relative-date-window";

// All dates are built in local time so the calendar maths is checked the way
// the panel uses it, whatever time zone the tests run in.
const local = (y: number, m: number, d: number, h = 0, min = 0) =>
  new Date(y, m - 1, d, h, min);

const DAY_MS = 24 * 60 * 60 * 1000;

describe("relative-date-window", () => {
  describe("GIVEN the 7-day range Tue 3 Nov 2026 – Tue 10 Nov 2026", () => {
    const start = local(2026, 11, 3);
    const end = local(2026, 11, 10);
    const now = local(2030, 1, 1);

    const expectations: Array<[RelativeDateWindowPreset, Date]> = [
      // Period shifts are exact millisecond offsets (they never drift across
      // DST), so the expected start is computed rather than a local midnight.
      ["previous_period", new Date(2 * start.getTime() - end.getTime())],
      ["next_period", local(2026, 11, 10)],
      ["months_back_1", local(2026, 10, 3)],
      ["months_back_2", local(2026, 9, 3)],
      ["months_back_3", local(2026, 8, 3)],
      ["months_ahead_1", local(2026, 12, 3)],
      ["months_ahead_2", local(2027, 1, 3)],
      ["months_ahead_3", local(2027, 2, 3)],
      ["year_back_1", local(2025, 11, 3)],
      ["year_ahead_1", local(2027, 11, 3)],
      ["year_back_2", local(2024, 11, 3)],
    ];

    describe.each(expectations)("WHEN %s is resolved", (preset, expected) => {
      it("THEN it starts on the catalogue date and lasts as long as the range", () => {
        expect.assertions(2);
        const resolved = resolveRelativeDateWindow(preset, start, end, now)!;
        expect(resolved.start.getTime()).toBe(expected.getTime());
        expect(resolved.end.getTime() - resolved.start.getTime()).toBe(
          end.getTime() - start.getTime()
        );
      });
    });

    describe("WHEN weekdays_back_1y is resolved", () => {
      it("THEN it shifts by exactly 364 days so the weekday matches", () => {
        expect.assertions(2);
        const resolved = resolveRelativeDateWindow(
          "weekdays_back_1y",
          start,
          end,
          now
        )!;
        expect(resolved.start.getTime()).toBe(start.getTime() - 364 * DAY_MS);
        expect(resolved.start.getDay()).toBe(start.getDay());
      });
    });
  });

  describe("GIVEN a 2-day range", () => {
    describe("WHEN previous_period is resolved", () => {
      it("THEN it is the 2 days before the range", () => {
        expect.assertions(2);
        const start = local(2026, 11, 8);
        const end = local(2026, 11, 10);
        const resolved = resolveRelativeDateWindow(
          "previous_period",
          start,
          end,
          local(2030, 1, 1)
        )!;
        expect(resolved.start.getTime()).toBe(local(2026, 11, 6).getTime());
        expect(resolved.end.getTime()).toBe(start.getTime());
      });
    });
  });

  describe("GIVEN a 2-hour range", () => {
    describe("WHEN next_period is resolved", () => {
      it("THEN it is the 2 hours after the range", () => {
        expect.assertions(2);
        const start = local(2026, 11, 8, 10);
        const end = local(2026, 11, 8, 12);
        const resolved = resolveRelativeDateWindow(
          "next_period",
          start,
          end,
          local(2030, 1, 1)
        )!;
        expect(resolved.start.getTime()).toBe(end.getTime());
        expect(resolved.end.getTime()).toBe(local(2026, 11, 8, 14).getTime());
      });
    });
  });

  describe("GIVEN a 90-day range", () => {
    describe("WHEN months_back_3 is resolved", () => {
      it("THEN it keeps the 90-day length", () => {
        expect.assertions(1);
        const start = local(2026, 6, 1);
        const end = new Date(start.getTime() + 90 * DAY_MS);
        const resolved = resolveRelativeDateWindow(
          "months_back_3",
          start,
          end,
          local(2030, 1, 1)
        )!;
        expect(resolved.end.getTime() - resolved.start.getTime()).toBe(
          90 * DAY_MS
        );
      });
    });
  });

  describe("GIVEN month-end dates", () => {
    describe("WHEN they are shifted by calendar months", () => {
      it("THEN 31 Mar − 1 month clamps to 28 Feb in a common year", () => {
        expect.assertions(1);
        expect(addCalendarMonthsClamped(local(2026, 3, 31), -1)).toEqual(
          local(2026, 2, 28)
        );
      });

      it("THEN 31 Mar − 1 month clamps to 29 Feb in a leap year", () => {
        expect.assertions(1);
        expect(addCalendarMonthsClamped(local(2028, 3, 31), -1)).toEqual(
          local(2028, 2, 29)
        );
      });

      it("THEN 31 May + 1 month clamps to 30 Jun", () => {
        expect.assertions(1);
        expect(addCalendarMonthsClamped(local(2026, 5, 31), 1)).toEqual(
          local(2026, 6, 30)
        );
      });

      it("THEN 29 Feb − 12 months becomes 28 Feb", () => {
        expect.assertions(1);
        expect(addCalendarMonthsClamped(local(2028, 2, 29), -12)).toEqual(
          local(2027, 2, 28)
        );
      });

      it("THEN the wall-clock time is kept", () => {
        expect.assertions(2);
        const shifted = addCalendarMonthsClamped(local(2026, 1, 15, 13, 45), 2);
        expect(shifted.getHours()).toBe(13);
        expect(shifted.getMinutes()).toBe(45);
      });

      it("THEN shifts across a year boundary land in the right year", () => {
        expect.assertions(2);
        expect(addCalendarMonthsClamped(local(2026, 1, 10), -3)).toEqual(
          local(2025, 10, 10)
        );
        expect(addCalendarMonthsClamped(local(2026, 11, 10), 3)).toEqual(
          local(2027, 2, 10)
        );
      });
    });
  });

  describe("GIVEN a range that ends now", () => {
    const start = local(2026, 11, 3);
    const end = local(2026, 11, 10);

    describe("WHEN a forward preset starts exactly at now", () => {
      it("THEN it is unavailable", () => {
        expect.assertions(1);
        expect(
          resolveRelativeDateWindow("next_period", start, end, end)!.available
        ).toBe(false);
      });
    });

    describe("WHEN a forward preset starts just before now", () => {
      it("THEN it is available, because part of it is in the past", () => {
        expect.assertions(1);
        const now = new Date(end.getTime() + 1);
        expect(
          resolveRelativeDateWindow("next_period", start, end, now)!.available
        ).toBe(true);
      });
    });

    describe("WHEN a backward preset is resolved", () => {
      it("THEN it is available", () => {
        expect.assertions(1);
        expect(
          resolveRelativeDateWindow("previous_period", start, end, end)!
            .available
        ).toBe(true);
      });
    });
  });

  describe("GIVEN an invalid range", () => {
    describe("WHEN a preset is resolved", () => {
      it("THEN it returns null", () => {
        expect.assertions(1);
        const at = local(2026, 11, 3);
        expect(resolveRelativeDateWindow("previous_period", at, at)).toBeNull();
      });
    });
  });

  describe("GIVEN preset ids", () => {
    describe("WHEN they are validated and labelled", () => {
      it("THEN every catalogue id is valid and has a label", () => {
        expect.assertions(RELATIVE_DATE_WINDOW_PRESETS.length * 2);
        RELATIVE_DATE_WINDOW_PRESETS.forEach((preset) => {
          expect(isRelativeDateWindowPreset(preset)).toBe(true);
          expect(relativeDateWindowPresetLabel(preset)).not.toBe(preset);
        });
      });

      it("THEN unknown ids are rejected", () => {
        expect.assertions(2);
        expect(isRelativeDateWindowPreset("last_7_days")).toBe(false);
        expect(isRelativeDateWindowPreset(undefined)).toBe(false);
      });
    });
  });
});

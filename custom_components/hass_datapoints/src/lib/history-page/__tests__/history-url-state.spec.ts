import { describe, expect, it } from "vitest";

import {
  makeDateWindowId,
  normalizeDateWindows,
  parseDateWindowsParam,
  parseHistoryPageStateParam,
  resolveDateWindows,
  serializeDateWindowsParam,
  serializeHistoryPageStateParam,
} from "@/lib/history-page/history-url-state";

describe("history-url-state", () => {
  describe("GIVEN a label and existing ids", () => {
    describe("WHEN makeDateWindowId is called", () => {
      it("THEN it returns a unique slug id", () => {
        expect.assertions(1);

        expect(
          makeDateWindowId("Heating season", new Set(["heating-season"]))
        ).toBe("heating-season-2");
      });
    });
  });

  describe("GIVEN mixed date windows", () => {
    describe("WHEN normalizeDateWindows is called", () => {
      it("THEN it filters invalid windows and normalizes valid ones", () => {
        expect.assertions(2);

        const normalized = normalizeDateWindows([
          {
            label: "Heating season",
            start: "2026-01-01T00:00:00.000Z",
            end: "2026-02-01T00:00:00.000Z",
          },
          {
            label: "Broken",
            start: "2026-02-01T00:00:00.000Z",
            end: "2026-01-01T00:00:00.000Z",
          },
        ]);

        expect(normalized).toHaveLength(1);
        expect(normalized[0]).toEqual(
          expect.objectContaining({
            label: "Heating season",
            start_time: "2026-01-01T00:00:00.000Z",
            end_time: "2026-02-01T00:00:00.000Z",
          })
        );
      });
    });
  });

  describe("GIVEN normalized date windows", () => {
    describe("WHEN they are serialized and parsed", () => {
      it("THEN they round-trip through the URL param shape", () => {
        expect.assertions(1);

        const windows = normalizeDateWindows([
          {
            label: "Heating season",
            start: "2026-01-01T00:00:00.000Z",
            end: "2026-02-01T00:00:00.000Z",
          },
          {
            label: "Cooling season",
            start: "2026-06-01T00:00:00.000Z",
            end: "2026-07-01T00:00:00.000Z",
          },
        ]);

        expect(
          parseDateWindowsParam(serializeDateWindowsParam(windows))
        ).toEqual(windows);
      });
    });
  });

  describe("GIVEN page state objects", () => {
    describe("WHEN they are serialized and parsed", () => {
      it("THEN they round-trip through the page_state query param", () => {
        expect.assertions(1);

        const state = {
          datapoint_scope: "all",
          chart_hover_snap_mode: "snap_to_data_points",
          series_rows: [
            {
              entity_id: "sensor.alpha",
              visible: false,
              color: "#abcdef",
            },
          ],
        };

        expect(
          parseHistoryPageStateParam(serializeHistoryPageStateParam(state))
        ).toEqual(state);
      });
    });
  });
  describe("GIVEN relative date windows", () => {
    describe("WHEN normalizeDateWindows is called", () => {
      it("THEN it keeps known presets and drops unknown ones", () => {
        expect.assertions(1);

        expect(
          normalizeDateWindows([
            {
              id: "prev",
              label: "Previous period",
              kind: "relative",
              preset: "previous_period",
            },
            { id: "bad", label: "Bad", kind: "relative", preset: "last_7d" },
            { id: "nameless", kind: "relative", preset: "next_period" },
          ])
        ).toEqual([
          {
            id: "prev",
            label: "Previous period",
            kind: "relative",
            preset: "previous_period",
          },
        ]);
      });
    });

    describe("WHEN a mixed list is serialized and parsed again", () => {
      it("THEN both kinds round-trip", () => {
        expect.assertions(2);

        const windows = [
          {
            id: "heating",
            label: "Heating season",
            start_time: "2026-01-01T00:00:00.000Z",
            end_time: "2026-02-01T00:00:00.000Z",
          },
          {
            id: "prev",
            label: "Previous period",
            kind: "relative",
            preset: "previous_period",
          },
        ];
        const serialized = serializeDateWindowsParam(windows);

        expect(serialized).toContain(
          "prev~Previous%20period~%40previous_period"
        );
        expect(parseDateWindowsParam(serialized)).toEqual(windows);
      });
    });

    describe("WHEN an old fixed-only URL is parsed", () => {
      it("THEN it still yields the fixed window", () => {
        expect.assertions(1);

        expect(
          parseDateWindowsParam(
            "heating~Heating%20season~2026-01-01T00%3A00%3A00.000Z~2026-02-01T00%3A00%3A00.000Z"
          )
        ).toEqual([
          {
            id: "heating",
            label: "Heating season",
            start_time: "2026-01-01T00:00:00.000Z",
            end_time: "2026-02-01T00:00:00.000Z",
          },
        ]);
      });
    });

    describe("WHEN resolveDateWindows is called with a selected range", () => {
      it("THEN fixed windows pass through and relative ones get resolved dates", () => {
        expect.assertions(1);

        const resolved = resolveDateWindows(
          [
            {
              id: "heating",
              label: "Heating season",
              start_time: "2026-01-01T00:00:00.000Z",
              end_time: "2026-02-01T00:00:00.000Z",
            },
            {
              id: "next",
              label: "Next period",
              kind: "relative",
              preset: "next_period",
            },
          ],
          new Date("2026-11-03T00:00:00.000Z"),
          new Date("2026-11-10T00:00:00.000Z"),
          new Date("2026-11-10T00:00:00.000Z")
        );

        expect(resolved).toEqual([
          {
            id: "heating",
            label: "Heating season",
            start_time: "2026-01-01T00:00:00.000Z",
            end_time: "2026-02-01T00:00:00.000Z",
            available: true,
          },
          {
            id: "next",
            label: "Next period",
            kind: "relative",
            preset: "next_period",
            start_time: "2026-11-10T00:00:00.000Z",
            end_time: "2026-11-17T00:00:00.000Z",
            available: false,
          },
        ]);
      });
    });

    describe("WHEN resolveDateWindows is called without a range", () => {
      it("THEN relative windows are left out", () => {
        expect.assertions(1);

        expect(
          resolveDateWindows(
            [
              {
                id: "prev",
                label: "Previous period",
                kind: "relative",
                preset: "previous_period",
              },
            ],
            null,
            null
          )
        ).toEqual([]);
      });
    });
  });
});

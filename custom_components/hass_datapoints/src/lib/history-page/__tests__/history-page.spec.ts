import { describe, expect, it } from "vitest";

import { loadLegacyScripts, repoPath } from "@/lib/__tests__/load-legacy-script";

function createWindowStorage() {
  const values = new Map();
  return {
    values,
    sessionStorage: {
      getItem(key) {
        return values.has(key) ? values.get(key) : null;
      },
      setItem(key, value) {
        values.set(key, value);
      },
    },
  };
}

describe("history-page libs", () => {
  describe("GIVEN date window labels and ranges", () => {
    describe("WHEN the URL state helpers are called", () => {
      it("THEN they normalize and round-trip windows", () => {
        expect.assertions(4);
        const urlState = loadLegacyScripts(
          [
            repoPath("custom_components", "hass_datapoints", "src", "lib", "domain", "chart-zoom.js"),
            repoPath("custom_components", "hass_datapoints", "src", "lib", "domain", "history-series.js"),
            repoPath("custom_components", "hass_datapoints", "src", "lib", "history-page", "history-url-state.js"),
          ],
          [
            "makeDateWindowId",
            "normalizeDateWindows",
            "parseDateWindowsParam",
            "serializeDateWindowsParam",
          ],
          {
            COLORS: ["#111111", "#222222", "#333333"],
          },
        );

        expect(urlState.makeDateWindowId("Heating season", new Set(["heating-season"]))).toBe("heating-season-2");

        const normalized = urlState.normalizeDateWindows([
          { label: "Heating season", start: "2026-01-01T00:00:00Z", end: "2026-02-01T00:00:00Z" },
          { label: "Heating season", start: "2026-02-01T00:00:00Z", end: "2026-03-01T00:00:00Z" },
        ]);

        expect(normalized[0].id).toBe("heating-season-1");
        expect(normalized[1].id).toBe("heating-season-2");

        const serialized = urlState.serializeDateWindowsParam(normalized);
        expect(urlState.parseDateWindowsParam(serialized)).toEqual(normalized);
      });
    });
  });

  describe("GIVEN history page state and preferences", () => {
    describe("WHEN the session-state helpers are called", () => {
      it("THEN they persist and normalize ownership state", () => {
        expect.assertions(7);
        const windowStub = createWindowStorage();
        const sessionState = loadLegacyScripts(
          [
            repoPath("custom_components", "hass_datapoints", "src", "lib", "domain", "chart-zoom.js"),
            repoPath("custom_components", "hass_datapoints", "src", "lib", "domain", "history-series.js"),
            repoPath("custom_components", "hass_datapoints", "src", "lib", "history-page", "history-url-state.js"),
            repoPath("custom_components", "hass_datapoints", "src", "lib", "history-page", "history-session-state.js"),
          ],
          [
            "readHistoryPageSessionState",
            "buildHistoryPageSessionState",
            "writeHistoryPageSessionState",
            "normalizeHistoryPagePreferences",
            "buildHistoryPagePreferencesPayload",
          ],
          {
            COLORS: ["#111111", "#222222", "#333333"],
            DOMAIN: "hass_datapoints",
            window: windowStub,
          },
        );

        const source = {
          _entities: ["sensor.a"],
          _seriesRows: [{ entity_id: "sensor.a", color: "#123456", visible: true }],
          _targetSelection: { entity_id: ["sensor.a"] },
          _targetSelectionRaw: { entity_id: ["sensor.a"] },
          _datapointScope: "linked",
          _showChartDatapointIcons: true,
          _showChartDatapointLines: false,
          _showChartTooltips: true,
          _showChartEmphasizedHoverGuides: false,
          _contentSplitRatio: 0.44,
          _startTime: new Date("2026-03-01T00:00:00Z"),
          _endTime: new Date("2026-03-02T00:00:00Z"),
          _chartZoomCommittedRange: { start: 10, end: 20 },
          _comparisonWindows: [{ label: "Saved", start: "2026-02-01T00:00:00Z", end: "2026-02-02T00:00:00Z" }],
          _hours: 24,
          _sidebarCollapsed: true,
          _preferredSeriesColors: {},
          _zoomLevel: "day",
          _dateSnapping: "minute",
        };

        expect(sessionState.buildHistoryPageSessionState(source).entities).toEqual(["sensor.a"]);
        sessionState.writeHistoryPageSessionState(source);
        expect(sessionState.readHistoryPageSessionState().sidebar_collapsed).toBe(true);

        const normalizedPreferences = sessionState.normalizeHistoryPagePreferences({
          zoom_level: "day",
          date_snapping: "minute",
          series_colors: { "sensor.a": "#abcdef", broken: "red" },
          date_windows: [{ label: "Saved", start: "2026-02-01T00:00:00Z", end: "2026-02-02T00:00:00Z" }],
        }, {
          zoomOptions: [{ value: "auto" }, { value: "day" }],
          snapOptions: [{ value: "hour" }, { value: "minute" }],
        });

        expect(normalizedPreferences.zoomLevel).toBe("day");
        expect(normalizedPreferences.dateSnapping).toBe("minute");
        expect(normalizedPreferences.preferredSeriesColors).toEqual({ "sensor.a": "#abcdef" });
        expect(normalizedPreferences.comparisonWindows).toHaveLength(1);

        expect(sessionState.buildHistoryPagePreferencesPayload(source)).toEqual({
          zoom_level: "day",
          date_snapping: "minute",
          series_colors: { "sensor.a": "#123456" },
          date_windows: normalizedPreferences.comparisonWindows,
        });
      });
    });
  });
});

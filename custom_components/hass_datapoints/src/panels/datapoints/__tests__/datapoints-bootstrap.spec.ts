import { afterEach, describe, expect, it, vi } from "vitest";
import { HassRecordsHistoryPanel } from "../datapoints";
import { normalizeHistorySeriesAnalysis } from "@/lib/domain/history-series";

describe("HassRecordsHistoryPanel bootstrap", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("GIVEN the shell has just been built after the initial hass assignment", () => {
    describe("WHEN bootstrapping post-shell setup", () => {
      it("THEN it loads preferences and updates the restored URL state", () => {
        expect.assertions(6);
        const ensureHistoryBounds = vi.fn();
        const ensureUserPreferences = vi.fn();
        const loadSavedPageIndicator = vi.fn();
        const syncHassBindings = vi.fn();
        const renderContent = vi.fn();
        const updateUrl = vi.fn();
        const panel = {
          _shellBuilt: true,
          _restoredFromSession: true,
          _ensureHistoryBounds: ensureHistoryBounds,
          _ensureUserPreferences: ensureUserPreferences,
          _loadSavedPageIndicator: loadSavedPageIndicator,
          _syncHassBindings: syncHassBindings,
          _renderContent: renderContent,
          _updateUrl: updateUrl,
        };

        HassRecordsHistoryPanel.prototype._bootstrapAfterShellBuilt.call(panel);

        expect(ensureHistoryBounds).toHaveBeenCalledTimes(1);
        expect(ensureUserPreferences).toHaveBeenCalledTimes(1);
        expect(loadSavedPageIndicator).toHaveBeenCalledTimes(1);
        expect(syncHassBindings).toHaveBeenCalledTimes(1);
        expect(renderContent).toHaveBeenCalledTimes(1);
        expect(updateUrl).toHaveBeenCalledWith({ push: false });
      });
    });
  });

  describe("GIVEN the URL selects targets but saved page state has row analysis", () => {
    describe("WHEN applying preference page state", () => {
      it("THEN it merges saved row settings onto the current target rows", () => {
        expect.assertions(2);
        const panel = {
          _hasTargetInUrl: true,
          _hasRangeInUrl: true,
          _hasPageStateInUrl: false,
          _preferredSeriesColors: {},
          _targetSelection: { entity_id: ["sensor.temp"] },
          _targetSelectionRaw: { entity_id: ["sensor.temp"] },
          _seriesRows: [
            {
              entity_id: "sensor.temp",
              color: "#03a9f4",
              visible: true,
              analysis: normalizeHistorySeriesAnalysis(null),
            },
          ],
          _applyPreferredSeriesColors:
            HassRecordsHistoryPanel.prototype._applyPreferredSeriesColors,
          _mergeSavedSeriesRows:
            HassRecordsHistoryPanel.prototype._mergeSavedSeriesRows,
          _syncSeriesState: HassRecordsHistoryPanel.prototype._syncSeriesState,
          _seriesColorQueryKey: () => "temperature",
        };

        HassRecordsHistoryPanel.prototype._applyPreferencePageState.call(panel, {
          series_rows: [
            {
              entity_id: "sensor.temp",
              color: "#ff0000",
              visible: true,
              analysis: {
                sample_interval: "24h",
                sample_aggregate: "mean",
              },
            },
          ],
        });

        expect(panel._seriesRows[0].analysis.sample_interval).toBe("24h");
        expect(panel._seriesRows[0].color).toBe("#ff0000");
      });
    });
  });

  describe("GIVEN local page state has already changed before preferences resolve", () => {
    describe("WHEN user preferences finish loading", () => {
      it("THEN they do not overwrite the current row visibility", () => {
        expect.assertions(2);
        const applyPreferencePageState = vi.fn();
        const saveUserPreferences = vi.fn();
        const renderTargetRows = vi.fn();
        const syncControls = vi.fn();
        const updateUrl = vi.fn();
        const renderContent = vi.fn();
        const panel = {
          _localPageStateDirty: true,
          _zoomLevel: "auto",
          _dateSnapping: "auto",
          _resolvedAutoZoomLevel: null,
          _preferredSeriesColors: {},
          _comparisonWindows: [],
          _seriesRows: [
            {
              entity_id: "sensor.temp",
              color: "#03a9f4",
              visible: false,
              analysis: normalizeHistorySeriesAnalysis(null),
            },
          ],
          _seriesColorQueryKey: () => "temperature",
          _applyPreferredSeriesColors:
            HassRecordsHistoryPanel.prototype._applyPreferredSeriesColors,
          _applyPreferencePageState: applyPreferencePageState,
          _saveUserPreferences: saveUserPreferences,
          _rendered: true,
          _renderTargetRows: renderTargetRows,
          _syncControls: syncControls,
          _updateUrl: updateUrl,
          _renderContent: renderContent,
          _context: {
            fetch: {
              ensureUserPreferences: ({ onSuccess }) => {
                onSuccess({
                  zoomLevel: "auto",
                  dateSnapping: "hour",
                  preferredSeriesColors: {},
                  comparisonWindows: [],
                  pageState: {
                    series_rows: [
                      {
                        entity_id: "sensor.temp",
                        visible: true,
                      },
                    ],
                  },
                  shouldPersistDefaults: false,
                });
                return Promise.resolve();
              },
            },
          },
        };

        return HassRecordsHistoryPanel.prototype._ensureUserPreferences
          .call(panel)
          .then(() => {
            expect(applyPreferencePageState).not.toHaveBeenCalled();
            expect(panel._seriesRows[0].visible).toBe(false);
          });
      });
    });
  });
});

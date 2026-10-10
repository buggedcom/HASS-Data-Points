/**
 * @deprecated migration-debris: rewrite in #32 (#06.4 menus) and #33 (#06.5 targets).
 * Kept running until its control migrates; use datapoints-mounted-* for the behavioural gate (#28).
 */
import { describe, expect, it, vi } from "vitest";
import { HassDatapointsHistoryPanel } from "../datapoints";
import { parseHistoryPageStateParam } from "@/lib/history-page/history-url-state";
import { normalizeHistorySeriesAnalysis } from "@/lib/domain/history-series";

import {
  control,
  createHassFixture,
  emitControlEvent,
  mountPanel,
  settlePanel,
  usePanelFixture,
} from "./panel-fixture";

usePanelFixture();

describe("HassDatapointsHistoryPanel URL sync", () => {
  describe("GIVEN a page-level chart display option changes", () => {
    describe("WHEN the option is applied", () => {
      it("THEN it updates the URL", () => {
        expect.assertions(3);
        const saveSessionState = vi.fn();
        const updateUrl = vi.fn();
        const renderSidebarOptions = vi.fn();
        const renderContent = vi.fn();
        const panel = {
          _showChartEmphasizedHoverGuides: false,
          _saveSessionState: saveSessionState,
          _updateUrl: updateUrl,
          _renderSidebarOptions: renderSidebarOptions,
          _renderContent: renderContent,
        };

        HassDatapointsHistoryPanel.prototype._setChartDatapointDisplayOption.call(
          panel,
          "hover_guides",
          true
        );

        expect(panel._showChartEmphasizedHoverGuides).toBe(true);
        expect(saveSessionState).toHaveBeenCalledTimes(1);
        expect(updateUrl).toHaveBeenCalledWith({ push: false });
      });
    });
  });

  describe("GIVEN the mounted range toolbar sidebar toggle", () => {
    describe("WHEN the sidebar is collapsed", () => {
      it("THEN updates the toolbar and persisted URL state", async () => {
        expect.assertions(3);
        const panel = await mountPanel(createHassFixture().hass);
        const toolbar = control(panel.shadowRoot!, "range-toolbar");
        emitControlEvent(toolbar, "dp-toolbar-sidebar-toggle");
        await settlePanel();
        expect(toolbar.sidebarCollapsed).toBe(true);
        expect(control(panel.shadowRoot!, "panel-shell").sidebarCollapsed).toBe(
          true
        );
        expect(
          parseHistoryPageStateParam(
            new URLSearchParams(window.location.search).get("page_state")
          )?.sidebar_collapsed
        ).toBe(true);
      });
    });
  });

  describe("GIVEN a target analysis option changes", () => {
    describe("WHEN the row analysis is updated", () => {
      it("THEN it updates the URL", () => {
        expect.assertions(3);
        const saveSessionState = vi.fn();
        const updateUrl = vi.fn();
        const renderTargetRows = vi.fn();
        const renderSidebarOptions = vi.fn();
        const renderContent = vi.fn();
        const panel = {
          _seriesRows: [
            {
              entity_id: "sensor.temp",
              color: "#03a9f4",
              visible: true,
              analysis: normalizeHistorySeriesAnalysis(null),
            },
          ],
          _saveSessionState: saveSessionState,
          _updateUrl: updateUrl,
          _renderTargetRows: renderTargetRows,
          _renderSidebarOptions: renderSidebarOptions,
          _renderContent: renderContent,
        };

        HassDatapointsHistoryPanel.prototype._setSeriesAnalysisOption.call(
          panel,
          "sensor.temp",
          "show_trend_lines",
          true
        );

        expect(panel._seriesRows[0].analysis.show_trend_lines).toBe(true);
        expect(saveSessionState).toHaveBeenCalledTimes(1);
        expect(updateUrl).toHaveBeenCalledWith({ push: false });
      });
    });
  });
});

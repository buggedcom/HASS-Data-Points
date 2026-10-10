import { beforeEach, describe, expect, it, vi } from "vitest";
import { HassDatapointsHistoryPanel } from "../datapoints";

describe("HassDatapointsHistoryPanel", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("GIVEN the measured-DOM sync methods were relocated (#06.8)", () => {
    describe("WHEN the panel prototype is inspected", () => {
      it("THEN no ad-hoc measured _sync* methods remain", () => {
        expect.assertions(4);
        const proto = HassDatapointsHistoryPanel.prototype as unknown as Record<
          string,
          unknown
        >;
        expect(proto._syncPageLayoutHeight).toBeUndefined();
        expect(proto._syncLiveEdgeHandle).toBeUndefined();
        expect(proto._syncListZoomState).toBeUndefined();
        expect(proto._syncHassBindings).toBeUndefined();
      });
    });
  });

  describe("GIVEN a mounted history chart with previous draw arguments", () => {
    describe("WHEN requesting a chart resize redraw", () => {
      it("THEN it replays the last chart draw on the next animation frame", async () => {
        expect.assertions(4);
        const drawSpy = vi.fn();
        const rafSpy = vi
          .spyOn(window, "requestAnimationFrame")
          .mockImplementation((callback: FrameRequestCallback) => {
            callback(0);
            return 1;
          });
        const requestChartResizeRedraw = vi.fn((chartEl) => {
          if (
            Array.isArray(chartEl?._lastDrawArgs) &&
            typeof chartEl?._drawChart === "function"
          ) {
            window.requestAnimationFrame(() => {
              chartEl._drawChart(...chartEl._lastDrawArgs);
            });
          }
        });
        const panel = {
          _context: {
            orchestration: {
              requestChartResizeRedraw,
            },
          },
          _chartEl: {
            _lastDrawArgs: ["hist", "stats", [], 1, 2, { drawRequestId: 7 }],
            _drawChart: drawSpy,
          },
        };

        HassDatapointsHistoryPanel.prototype._requestChartResizeRedraw.call(
          panel
        );

        expect(rafSpy).toHaveBeenCalledOnce();
        expect(drawSpy).toHaveBeenCalledOnce();
        expect(drawSpy).toHaveBeenCalledWith("hist", "stats", [], 1, 2, {
          drawRequestId: 7,
        });
        expect(requestChartResizeRedraw).toHaveBeenCalledWith(panel._chartEl);
      });
    });
  });

  describe("GIVEN a panel with orchestration context", () => {
    describe("WHEN requesting another chart resize redraw", () => {
      it("THEN it delegates the redraw request to orchestration", () => {
        expect.assertions(1);
        const requestChartResizeRedraw = vi.fn();
        const panel = {
          _context: {
            orchestration: {
              requestChartResizeRedraw,
            },
          },
          _chartEl: null,
        };

        HassDatapointsHistoryPanel.prototype._requestChartResizeRedraw.call(
          panel
        );

        expect(requestChartResizeRedraw).toHaveBeenCalledWith(null);
      });
    });
  });
});

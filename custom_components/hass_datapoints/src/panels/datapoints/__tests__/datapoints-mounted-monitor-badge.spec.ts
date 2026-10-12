import { describe, expect, it } from "vitest";
import type { AnomalyMonitor } from "@/lib/data/monitors-api";
import {
  control,
  createHassFixture,
  mountPanel,
  settlePanel,
  usePanelFixture,
} from "./panel-fixture";

usePanelFixture();

function monitor(
  id: string,
  enabled: boolean,
  lastClusterCount: number
): AnomalyMonitor {
  return {
    id,
    enabled,
    last_cluster_count: lastClusterCount,
  } as unknown as AnomalyMonitor;
}

function fixtureWithMonitors(monitors: AnomalyMonitor[]) {
  const fixture = createHassFixture({ admin: true });
  const original = fixture.sendMessagePromise.getMockImplementation()!;
  let current = monitors;
  fixture.sendMessagePromise.mockImplementation(async (message) =>
    message.type === "hass_datapoints/monitors/list"
      ? { monitors: current }
      : original(message)
  );
  const listeners: Array<() => void> = [];
  (
    fixture.hass.connection.subscribeEvents as unknown as {
      mockImplementation: (fn: unknown) => void;
    }
  ).mockImplementation(async (cb: () => void, type: string) => {
    if (type === "hass_datapoints_monitors_updated") {
      listeners.push(cb);
    }
    return fixture.unsubscribe;
  });
  return {
    ...fixture,
    setMonitors: (next: AnomalyMonitor[]) => {
      current = next;
    },
    fire: () => listeners.forEach((cb) => cb()),
  };
}

describe("GIVEN a mounted panel with monitor fixtures", () => {
  describe("WHEN 2 are enabled and firing, 1 disabled and firing, 1 enabled and quiet", () => {
    it("THEN panel-shell receives monitorAnomalyCount 2", async () => {
      expect.assertions(1);
      const f = fixtureWithMonitors([
        monitor("a", true, 2),
        monitor("b", true, 1),
        monitor("c", false, 5),
        monitor("d", true, 0),
      ]);
      const panel = await mountPanel(f.hass);
      await settlePanel();
      const shell = control(panel.shadowRoot!, "panel-shell");
      expect(
        (shell as unknown as { monitorAnomalyCount: number })
          .monitorAnomalyCount
      ).toBe(2);
    });
  });

  describe("WHEN a monitors_updated event lowers the firing count to 0", () => {
    it("THEN the badge clears", async () => {
      expect.assertions(2);
      const f = fixtureWithMonitors([monitor("a", true, 2)]);
      const panel = await mountPanel(f.hass);
      await settlePanel();
      const shell = control(panel.shadowRoot!, "panel-shell");
      expect(
        shell.shadowRoot!.querySelector(".monitors-badge")?.textContent?.trim()
      ).toBe("1");
      f.setMonitors([monitor("a", true, 0)]);
      f.fire();
      await settlePanel();
      expect(shell.shadowRoot!.querySelector(".monitors-badge")).toBeNull();
    });
  });
});

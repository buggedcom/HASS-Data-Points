import { afterEach, describe, expect, it } from "vitest";
import MockDate from "mockdate";
import * as preview from "../../../../../.storybook/preview";
import { HassDatapointsActionCard } from "@/cards/action/action";
import { createMockHass } from "@/test-support/mock-hass";

if (!customElements.get("hass-datapoints-action-card")) {
  customElements.define(
    "hass-datapoints-action-card",
    HassDatapointsActionCard
  );
}

afterEach(() => {
  document.body.replaceChildren();
  MockDate.reset();
});

async function renderDateAtBuildTime(buildTime: string) {
  MockDate.set(buildTime);
  const cleanup = await preview.beforeEach();
  const card = new HassDatapointsActionCard();
  try {
    card.setConfig({ title: "Record Event" });
    card.hass = createMockHass() as never;
    document.body.append(card);
    await card.updateComplete;
    return (card.shadowRoot?.querySelector("#date") as HTMLInputElement).value;
  } finally {
    card.remove();
    cleanup();
  }
}

describe("GIVEN the action card in the Storybook preview", () => {
  describe("WHEN snapshots are rendered at different build times", () => {
    it("THEN the displayed date stays identical", async () => {
      expect.assertions(1);
      const firstDate = await renderDateAtBuildTime("2026-10-07T05:57:00Z");
      const secondDate = await renderDateAtBuildTime("2026-10-07T19:43:00Z");
      expect(firstDate).toBe(secondDate);
    });
  });
});

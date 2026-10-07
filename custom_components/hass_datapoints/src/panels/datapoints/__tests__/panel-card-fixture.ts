import type { CardConfig, HassLike } from "@/lib/types";

// The panel's controls are real elements. Only the expensive chart/list boundary
// is replaced: their config, hass and zoom APIs are the outputs under test.
export class PanelCardFixture extends HTMLElement {
  config: CardConfig = {};

  hass: Nullable<HassLike> = null;

  externalZoomRange: Nullable<{ start: number; end: number }> = null;

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot!.innerHTML =
      '<hass-datapoints-history-chart><div id="chart-top-slot" hidden></div></hass-datapoints-history-chart>';
  }

  getComparisonTabsHost(): Nullable<HTMLElement> {
    return this.shadowRoot!.querySelector("#chart-top-slot");
  }

  setConfig(config: CardConfig): void {
    this.config = config;
  }

  setExternalZoomRange(range: Nullable<{ start: number; end: number }>): void {
    this.externalZoomRange = range;
  }

  refresh(): void {}
}

customElements.define("hass-datapoints-history-card", PanelCardFixture);

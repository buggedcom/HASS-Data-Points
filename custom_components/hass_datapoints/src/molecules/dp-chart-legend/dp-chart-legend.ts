import { LitElement, html, css } from "lit";
import type { SeriesItem } from "@/lib/types";
import "@/atoms/interactive/dp-legend-item/dp-legend-item";
export class DpChartLegend extends LitElement {
  static properties = {
    series: { type: Array },
    hiddenSeries: { type: Object },
    wrapRows: { type: Boolean, attribute: "wrap-rows" },
  };
  declare series: SeriesItem[];
  declare hiddenSeries: Set<string>;
  declare wrapRows: boolean;
  static styles = css`
    :host { display: block; }
    .legend {
      display: flex; flex-wrap: wrap;
      gap: 2px 8px;
      padding: 4px var(--dp-spacing-lg, 16px) 8px;
      overflow-y: auto; max-height: calc((30px * 3) + 16px);
    }
  `;
  constructor() {
    super();
    this.series = [];
    this.hiddenSeries = new Set();
    this.wrapRows = false;
  }
  _onToggle(entityId: string, e: CustomEvent<{ pressed: boolean }>) {
    this.dispatchEvent(
      new CustomEvent("dp-series-toggle", {
        detail: { entityId, visible: e.detail.pressed },
        bubbles: true,
        composed: true,
      }),
    );
  }
  render() {
    return html`
      <div class="legend ${this.wrapRows ? "wrap-rows" : ""}">
        ${this.series.map(
          (s) => html`
            <dp-legend-item
              .label=${s.label}
              .color=${s.color}
              .unit=${s.unit ?? ""}
              .pressed=${!this.hiddenSeries.has(s.entityId)}
              .opacity=${1}
              @dp-legend-toggle=${(e: CustomEvent<{ pressed: boolean }>) => this._onToggle(s.entityId, e)}
            ></dp-legend-item>
          `,
        )}
      </div>
    `;
  }
}
customElements.define("dp-chart-legend", DpChartLegend);

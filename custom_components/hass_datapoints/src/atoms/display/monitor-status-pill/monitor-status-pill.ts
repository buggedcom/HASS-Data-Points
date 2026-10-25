import { LitElement, html } from "lit";
import { property } from "lit/decorators.js";
import type { MonitorStatus } from "@/lib/data/monitor-status";

import { styles } from "./monitor-status-pill.styles";

/** English fallback labels, used when no localized `label` is supplied. */
const DEFAULT_LABELS: Record<MonitorStatus, string> = {
  paused: "Paused",
  healthy: "Healthy",
  warning: "Warning",
  triggered: "Triggered",
};

/**
 * `monitor-status-pill` renders a monitor's display status as a coloured dot
 * plus a label, using the design-system semantic colours (success / warning /
 * error / muted). It is a pure display atom: it holds no i18n infrastructure.
 * The localized label is supplied by the (localized) container via `label`;
 * when omitted it falls back to the capitalised English status name so the
 * atom is usable standalone (stories, tests).
 */
export class MonitorStatusPill extends LitElement {
  static styles = styles;

  /** The display status this pill represents. */
  @property({ type: String }) accessor status: MonitorStatus = "healthy";

  /** Localized label text; falls back to the English status name when empty. */
  @property({ type: String }) accessor label: string = "";

  render() {
    const text = this.label || DEFAULT_LABELS[this.status];
    return html`
      <span class="pill status-${this.status}">
        <span class="dot" part="dot"></span>
        <span class="label">${text}</span>
      </span>
    `;
  }
}

customElements.define("monitor-status-pill", MonitorStatusPill);

declare global {
  interface HTMLElementTagNameMap {
    "monitor-status-pill": MonitorStatusPill;
  }
}

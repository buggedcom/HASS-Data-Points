/**
 * Unified event contract for all form-atom value changes.
 *
 * Every interactive atom fires a single `dp-change` CustomEvent whose detail
 * is one member of this discriminated union. Consumers can narrow by `type`
 * when a single handler covers multiple atom types, or cast directly when
 * attached to a known element.
 *
 * Example (direct cast — most common):
 * ```ts
 * @dp-change=${(e: CustomEvent<DpChangeDetail>) =>
 *   this._set("title", (e.detail as { type: "field"; value: string }).value)}
 * ```
 *
 * Example (discriminant guard — one handler for many atoms):
 * ```ts
 * private _onChange(e: CustomEvent<DpChangeDetail>) {
 *   if (e.detail.type === "switch") this._set("enabled", e.detail.checked);
 *   if (e.detail.type === "field") this._set("label", e.detail.value);
 * }
 * ```
 */
export type DpChangeDetail =
  | { type: "select"; value: string }
  | { type: "field"; value: string }
  | { type: "switch"; checked: boolean }
  | { type: "number"; value: string }
  | { type: "color"; color: string }
  | { type: "check"; checked: boolean }
  | { type: "item"; checked: boolean; value: string }
  | { type: "entity"; value: string }
  | { type: "entity-list"; value: string[] }
  | { type: "datetime"; value: string }
  | { type: "icon"; value: string }
  | { type: "radio"; value: string };

/**
 * Monitors-panel outbound events are plain string `CustomEvent`s (NOT part of
 * the `DpChangeDetail` form-atom union) emitted via the panel's own `_emit`.
 * Both carry the monitor's own anomaly detection config so the chart/dialog
 * overlay recomputes with the monitor's actual methods (user story 8 of #68),
 * not a hardcoded chart default.
 * - `dp-monitors-panel-open-chart`: {@link MonitorsOpenChartDetail}
 * - `dp-monitors-panel-open-entity`: {@link MonitorsOpenEntityDetail}
 */

/** Detail shape for the `dp-monitors-panel-open-chart` event (monitors panel). */
export interface MonitorsOpenChartDetail {
  entityIds: string[];
  startMs: number;
  endMs: number;
  monitorId: string;
  /** The monitor's configured detection methods (empty → chart default). */
  anomalyMethods: string[];
  /** The monitor's configured sensitivity. */
  anomalySensitivity: string;
}

/** Detail shape for the `dp-monitors-panel-open-entity` event (monitors panel). */
export interface MonitorsOpenEntityDetail {
  entityId: string;
  monitorId: string;
  /** The monitor's configured detection methods (empty → chart default). */
  anomalyMethods: string[];
  /** The monitor's configured sensitivity. */
  anomalySensitivity: string;
}

/**
 * Dispatch a `dp-change` event from the given host element.
 * The event bubbles and is composed so it crosses shadow-DOM boundaries.
 */
export function dispatchChange(
  host: EventTarget,
  detail: DpChangeDetail
): void {
  host.dispatchEvent(
    new CustomEvent("dp-change", { detail, bubbles: true, composed: true })
  );
}

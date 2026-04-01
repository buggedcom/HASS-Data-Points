import { LitElement, html, css, nothing } from "lit";
import type { NormalizedAnalysis, ComparisonWindow } from "../dp-target-row/dp-target-row";
import "../dp-target-row/dp-target-row";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RowConfig {
  entity_id: string;
  color: string;
  visible: boolean;
  analysis: NormalizedAnalysis;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * `dp-target-row-list` renders an ordered list of `dp-target-row` components
 * with drag-to-reorder support.
 *
 * @fires dp-rows-reorder - `{ rows: RowConfig[] }` The updated rows array after a drag-drop reorder.
 * @fires dp-row-color-change - Bubbled from child `dp-target-row`. `{ index, color }`
 * @fires dp-row-visibility-change - Bubbled from child `dp-target-row`. `{ entityId, visible }`
 * @fires dp-row-toggle-analysis - Bubbled from child `dp-target-row`. `{ entityId }`
 * @fires dp-row-remove - Bubbled from child `dp-target-row`. `{ index }`
 * @fires dp-row-analysis-change - Bubbled from child `dp-target-row`. `{ entityId, key, value }`
 */
export class DpTargetRowList extends LitElement {
  static properties = {
    rows: { type: Array },
    states: { type: Object, attribute: false },
    canShowDeltaAnalysis: { type: Boolean, attribute: "can-show-delta-analysis" },
    comparisonWindows: { type: Array, attribute: false },
  };

  declare rows: RowConfig[];
  /** HA entity states map (entity_id → state object). Passed directly to each `dp-target-row`. */
  declare states: Record<string, Record<string, unknown>>;
  declare canShowDeltaAnalysis: boolean;
  declare comparisonWindows: ComparisonWindow[];

  /** Index of the row currently being dragged, or null when not dragging. */
  private _dragSourceIndex: number | null = null;

  static styles = css`
    :host {
      display: block;
      --dp-spacing-xs: calc(var(--spacing, 8px) * 0.5);
      --dp-spacing-sm: var(--spacing, 8px);
      --dp-spacing-md: calc(var(--spacing, 8px) * 1.5);
      --dp-spacing-lg: calc(var(--spacing, 8px) * 2);
      --dp-spacing-xl: calc(var(--spacing, 8px) * 2.5);
    }

    .history-target-table {
      display: grid;
    }

    .history-target-table-body {
      display: grid;
      gap: calc(var(--spacing, 8px) * 1.25);
    }

    .history-target-empty {
      padding: var(--dp-spacing-md) var(--dp-spacing-sm);
      border-radius: 12px;
      background: color-mix(in srgb, var(--primary-text-color, #111) 4%, transparent);
      color: var(--secondary-text-color, #9e9e9e);
      font-size: 0.84rem;
    }

    /* Drag states applied to the dp-target-row host element */
    dp-target-row.is-dragging {
      opacity: 0.35;
      pointer-events: none;
    }

    dp-target-row.is-drag-over-before {
      box-shadow: inset 0 3px 0 -1px var(--primary-color, #03a9f4);
    }

    dp-target-row.is-drag-over-after {
      box-shadow: inset 0 -3px 0 -1px var(--primary-color, #03a9f4);
    }
  `;

  render() {
    if (!this.rows.length) {
      return html`
        <div class="history-target-table">
          <div class="history-target-empty">No data points added yet.</div>
        </div>
      `;
    }

    return html`
      <div class="history-target-table">
        <div
          class="history-target-table-body"
          @dragover=${this._onDragOver}
          @dragleave=${this._onDragLeave}
          @drop=${this._onDrop}
        >
          ${this.rows.map(
            (row, index) => html`
              <dp-target-row
                draggable="true"
                .color=${row.color}
                .visible=${row.visible}
                .analysis=${row.analysis}
                .index=${index}
                .canShowDeltaAnalysis=${this.canShowDeltaAnalysis}
                .stateObj=${this.states?.[row.entity_id] ?? null}
                .comparisonWindows=${this.comparisonWindows}
                data-row-index=${index}
                @dragstart=${(e: DragEvent) => this._onDragStart(e, index)}
                @dragend=${this._onDragEnd}
              ></dp-target-row>
            `,
          )}
        </div>
      </div>
    `;
  }

  // ---------------------------------------------------------------------------
  // Drag-to-reorder handlers
  // ---------------------------------------------------------------------------

  private _onDragStart(e: DragEvent, index: number) {
    this._dragSourceIndex = index;
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", String(index));
    }
    const target = e.currentTarget as HTMLElement;
    // Delay so the drag ghost captures the non-dimmed appearance.
    setTimeout(() => target.classList.add("is-dragging"), 0);
  }

  private _onDragEnd = (e: DragEvent) => {
    this._dragSourceIndex = null;
    const target = e.currentTarget as HTMLElement;
    target.classList.remove("is-dragging");
    this._clearDropIndicators();
  };

  private _onDragOver(e: DragEvent) {
    if (this._dragSourceIndex === null) return;
    e.preventDefault();
    if (e.dataTransfer) e.dataTransfer.dropEffect = "move";

    const rowEl = this._rowFromEvent(e);
    if (!rowEl) return;

    const rect = rowEl.getBoundingClientRect();
    const isAbove = e.clientY < rect.top + rect.height / 2;
    this._clearDropIndicators();
    rowEl.classList.add(isAbove ? "is-drag-over-before" : "is-drag-over-after");
  }

  private _onDragLeave(e: DragEvent) {
    const rowEl = this._rowFromEvent(e);
    if (rowEl && !rowEl.contains(e.relatedTarget as Node)) {
      rowEl.classList.remove("is-drag-over-before", "is-drag-over-after");
    }
  }

  private _onDrop(e: DragEvent) {
    e.preventDefault();
    // Prefer the in-memory tracked index; fall back to dataTransfer for cross-window drags.
    const fromIndex =
      this._dragSourceIndex ??
      parseInt(e.dataTransfer?.getData("text/plain") ?? "", 10);
    const rowEl = this._rowFromEvent(e);
    if (!rowEl || !Number.isFinite(fromIndex)) return;

    const toIndexRaw = parseInt((rowEl as HTMLElement).dataset.rowIndex ?? "", 10);
    if (!Number.isFinite(toIndexRaw)) return;

    const rect = rowEl.getBoundingClientRect();
    const isAbove = e.clientY < rect.top + rect.height / 2;
    const insertBeforeIndex = isAbove ? toIndexRaw : toIndexRaw + 1;
    const toIndex = fromIndex < insertBeforeIndex ? insertBeforeIndex - 1 : insertBeforeIndex;

    rowEl.classList.remove("is-drag-over-before", "is-drag-over-after");

    if (fromIndex !== toIndex) {
      const newRows = [...this.rows];
      const [moved] = newRows.splice(fromIndex, 1);
      newRows.splice(toIndex, 0, moved);
      this.dispatchEvent(
        new CustomEvent("dp-rows-reorder", {
          detail: { rows: newRows },
          bubbles: true,
          composed: true,
        }),
      );
    }
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  /** Walk the composed event path to find the nearest dp-target-row element. */
  private _rowFromEvent(e: DragEvent): Element | null {
    for (const node of e.composedPath()) {
      if (node instanceof Element && node.tagName?.toLowerCase() === "dp-target-row") {
        return node;
      }
    }
    return null;
  }

  private _clearDropIndicators() {
    this.shadowRoot?.querySelectorAll("dp-target-row").forEach((r) => {
      r.classList.remove("is-drag-over-before", "is-drag-over-after");
    });
  }
}

customElements.define("dp-target-row-list", DpTargetRowList);

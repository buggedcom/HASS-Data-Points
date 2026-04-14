import { html, LitElement, nothing } from "lit";
import { property, state } from "lit/decorators.js";
import { localized, msg } from "@/lib/i18n/localize";

import { styles } from "./anomaly-monitor-wizard.styles";
import {
  ANALYSIS_ANOMALY_METHOD_OPTIONS,
  ANALYSIS_ANOMALY_SENSITIVITY_OPTIONS,
  ANALYSIS_ANOMALY_RATE_WINDOW_OPTIONS,
  ANALYSIS_ANOMALY_ZSCORE_WINDOW_OPTIONS,
  ANALYSIS_ANOMALY_PERSISTENCE_WINDOW_OPTIONS,
} from "@/molecules/analysis-anomaly-group/analysis-anomaly-group";
import {
  ANALYSIS_TREND_METHOD_OPTIONS,
  ANALYSIS_TREND_WINDOW_OPTIONS,
} from "@/molecules/analysis-trend-group/analysis-trend-group";
import {
  SAMPLE_INTERVAL_OPTIONS,
  SAMPLE_AGGREGATE_OPTIONS,
} from "@/molecules/analysis-sample-group/analysis-sample-group";
import {
  createMonitor,
  updateMonitor,
  type AnomalyMonitor,
  type CombinedMonitor,
  type IndividualMonitor,
  type CreateMonitorPayload,
  type MonitorType,
} from "@/lib/data/monitors-api";
import type { NormalizedAnalysis } from "@/molecules/target-row/types";
import type { HassLike } from "@/lib/types";
import {
  normalizeTargetValue,
  resolveEntityIdsFromTarget,
  type NormalizedTargetSelection,
} from "@/lib/domain/target-selection";
import "@/atoms/form/inline-select/inline-select";
import "@/atoms/form/entity-chip/entity-chip";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const LOOK_BACK_OPTIONS = [
  { value: 6, label: "6 hours" },
  { value: 12, label: "12 hours" },
  { value: 24, label: "24 hours" },
  { value: 48, label: "48 hours" },
  { value: 168, label: "7 days" },
];

const SCAN_INTERVAL_OPTIONS = [
  { value: 15, label: "15 minutes" },
  { value: 30, label: "30 minutes" },
  { value: 60, label: "1 hour" },
  { value: 120, label: "2 hours" },
  { value: 360, label: "6 hours" },
];

// ---------------------------------------------------------------------------
// Per-entity analysis config
// ---------------------------------------------------------------------------

interface EntityAnalysisConfig {
  anomaly_methods: string[];
  anomaly_sensitivity: string;
  anomaly_rate_window: string;
  anomaly_zscore_window: string;
  anomaly_persistence_window: string;
  anomaly_trend_method: string;
  anomaly_trend_window: string;
  sample_interval: string;
  sample_aggregate: string;
  anomaly_use_sampled_data: boolean;
}

function defaultEntityConfig(
  prefill?: Partial<NormalizedAnalysis> | null
): EntityAnalysisConfig {
  return {
    anomaly_methods: prefill?.anomaly_methods?.length
      ? [...prefill.anomaly_methods]
      : ["trend_residual"],
    anomaly_sensitivity: prefill?.anomaly_sensitivity ?? "medium",
    anomaly_rate_window: prefill?.anomaly_rate_window ?? "1h",
    anomaly_zscore_window: prefill?.anomaly_zscore_window ?? "24h",
    anomaly_persistence_window: prefill?.anomaly_persistence_window ?? "1h",
    anomaly_trend_method: prefill?.anomaly_trend_method || "rolling_average",
    anomaly_trend_window: prefill?.anomaly_trend_window ?? "24h",
    sample_interval: prefill?.sample_interval ?? "raw",
    sample_aggregate: prefill?.sample_aggregate ?? "mean",
    anomaly_use_sampled_data: prefill?.anomaly_use_sampled_data ?? false,
  };
}

function configFromMonitor(m: AnomalyMonitor): EntityAnalysisConfig {
  return {
    anomaly_methods: [...m.anomaly_methods],
    anomaly_sensitivity: m.anomaly_sensitivity,
    anomaly_rate_window: m.anomaly_rate_window,
    anomaly_zscore_window: m.anomaly_zscore_window,
    anomaly_persistence_window: m.anomaly_persistence_window,
    anomaly_trend_method: m.anomaly_trend_method,
    anomaly_trend_window: m.anomaly_trend_window,
    sample_interval: m.sample_interval ?? "raw",
    sample_aggregate: m.sample_aggregate ?? "mean",
    anomaly_use_sampled_data: m.anomaly_use_sampled_data ?? false,
  };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * `anomaly-monitor-wizard` renders a 3-step dialog for creating or editing anomaly monitors.
 *
 * @fires dp-monitor-wizard-close  — `{}` cancel/close
 * @fires dp-monitor-wizard-saved  — `{ monitors: AnomalyMonitor[] }` after successful save
 */
@localized()
export class AnomalyMonitorWizard extends LitElement {
  static styles = styles;

  @property({ type: Object }) accessor hass: Nullable<HassLike> = null;

  /** Whether the dialog is open. */
  @property({ type: Boolean }) accessor open: boolean = false;

  /** Pre-fill entity IDs for step 1. */
  @property({ type: Array }) accessor prefillEntityIds: string[] = [];

  /** Pre-fill analysis settings (applied to pre-filled entities). */
  @property({ type: Object })
  accessor prefillAnalysis: Partial<NormalizedAnalysis> | null = null;

  /** If set, the wizard is in edit mode for this monitor. */
  @property({ type: Object }) accessor editMonitor: AnomalyMonitor | null =
    null;

  /**
   * Entity IDs from the current chart that have anomaly detection enabled
   * (non-binary, with at least one method). Shown as quick-add chips in step 1.
   */
  @property({ type: Array }) accessor suggestedEntityIds: string[] = [];

  // ---- wizard state --------------------------------------------------------

  @state() accessor _step: 1 | 2 | 3 = 1;

  /** Raw target value bound to ha-target-picker in step 1. */
  @state() accessor _target: Partial<NormalizedTargetSelection> = {};

  /** Resolved entity IDs — populated from _target when advancing to step 2. */
  @state() accessor _entityIds: string[] = [];

  @state() accessor _entityConfigs: Map<string, EntityAnalysisConfig> =
    new Map();

  @state() accessor _activeEntityId: string = "";

  @state() accessor _name: string = "";

  @state() accessor _lookBackHours: number = 24;

  @state() accessor _scanIntervalMinutes: number = 30;

  @state() accessor _monitorType: MonitorType = "individual";

  @state() accessor _overlapMode: string = "all";

  @state() accessor _error: string = "";

  @state() accessor _saving: boolean = false;

  // -------------------------------------------------------------------------
  // Lifecycle
  // -------------------------------------------------------------------------

  connectedCallback() {
    super.connectedCallback();
    this._initFromProps();
  }

  updated(changed: Map<string, unknown>) {
    if (changed.has("open") && this.open) {
      this._initFromProps();
    }
    if (changed.has("editMonitor") && this.editMonitor) {
      this._initFromProps();
    }
  }

  private _initFromProps() {
    if (this.editMonitor) {
      const m = this.editMonitor;
      const ids =
        m.type === "combined"
          ? [...(m as CombinedMonitor).entity_ids]
          : [(m as IndividualMonitor).entity_id];
      const cfg = configFromMonitor(m);
      const configs = new Map<string, EntityAnalysisConfig>();
      for (const id of ids) configs.set(id, { ...cfg });

      this._step = 2;
      this._entityIds = ids;
      this._entityConfigs = configs;
      this._activeEntityId = ids[0] ?? "";
      this._name = m.name;
      this._lookBackHours = m.look_back_hours;
      this._scanIntervalMinutes = m.scan_interval_minutes;
      this._monitorType = m.type;
      this._overlapMode =
        m.type === "combined"
          ? ((m as CombinedMonitor).overlap_mode ?? "all")
          : "all";
    } else {
      const ids = [...(this.prefillEntityIds ?? [])];
      const configs = new Map<string, EntityAnalysisConfig>();
      for (const id of ids)
        configs.set(id, defaultEntityConfig(this.prefillAnalysis));

      this._step = 1;
      this._target = ids.length ? { entity_id: ids } : {};
      this._entityIds = ids;
      this._entityConfigs = configs;
      this._activeEntityId = ids[0] ?? "";
      this._name = "";
      this._lookBackHours = 24;
      this._scanIntervalMinutes = 30;
      this._monitorType = "individual";
      this._overlapMode = "all";
    }
    this._error = "";
    this._saving = false;
  }

  // -------------------------------------------------------------------------
  // Entity config helpers
  // -------------------------------------------------------------------------

  private _getEntityConfig(entityId: string): EntityAnalysisConfig {
    return this._entityConfigs.get(entityId) ?? defaultEntityConfig();
  }

  private _updateEntityConfig(
    entityId: string,
    key: keyof EntityAnalysisConfig,
    value: unknown
  ) {
    const current = this._getEntityConfig(entityId);
    const updated = new Map(this._entityConfigs);
    updated.set(entityId, { ...current, [key]: value });
    this._entityConfigs = updated;
  }

  private _toggleMethod(entityId: string, method: string, checked: boolean) {
    const cfg = this._getEntityConfig(entityId);
    const methods = checked
      ? [...cfg.anomaly_methods, method]
      : cfg.anomaly_methods.filter((m) => m !== method);
    this._updateEntityConfig(entityId, "anomaly_methods", methods);
  }

  // -------------------------------------------------------------------------
  // Entity add / remove
  // -------------------------------------------------------------------------

  private _onTargetChanged(ev: CustomEvent<{ value: unknown }>) {
    this._target = normalizeTargetValue(
      (ev.detail?.value ?? {}) as Parameters<typeof normalizeTargetValue>[0]
    );
  }

  private _addSuggestedEntity(entityId: string) {
    const current = this._target.entity_id ?? [];
    if (!current.includes(entityId)) {
      this._target = { ...this._target, entity_id: [...current, entityId] };
    }
  }

  // -------------------------------------------------------------------------
  // Navigation
  // -------------------------------------------------------------------------

  private _emit(name: string, detail: RecordWithUnknownValues = {}) {
    this.dispatchEvent(
      new CustomEvent(name, { detail, bubbles: true, composed: true })
    );
  }

  private _onClose() {
    this._emit("dp-monitor-wizard-close");
  }

  private _onDialogClosed() {
    this._emit("dp-monitor-wizard-close");
  }

  private _onBack() {
    if (this._step === 3) {
      this._step = 2;
    } else if (this._step === 2 && !this.editMonitor) {
      // Sync target picker back to the current resolved entity list
      this._target = this._entityIds.length
        ? { entity_id: [...this._entityIds] }
        : {};
      this._step = 1;
    }
    this._error = "";
  }

  private _onNext() {
    if (this._step === 1) {
      const resolved = resolveEntityIdsFromTarget(this.hass, this._target);
      if (resolved.length === 0) {
        this._error = msg("Select at least one entity.");
        return;
      }
      // Sync entity configs to the resolved list
      const newConfigs = new Map(this._entityConfigs);
      for (const id of resolved) {
        if (!newConfigs.has(id))
          newConfigs.set(id, defaultEntityConfig(this.prefillAnalysis));
      }
      for (const id of [...newConfigs.keys()]) {
        if (!resolved.includes(id)) newConfigs.delete(id);
      }
      this._entityIds = resolved;
      this._entityConfigs = newConfigs;
      this._activeEntityId = resolved[0] ?? "";
      this._error = "";
      this._step = 2;
    } else if (this._step === 2) {
      const anyEmpty = this._entityIds.some(
        (id) => this._getEntityConfig(id).anomaly_methods.length === 0
      );
      if (anyEmpty) {
        this._error = msg("Each entity needs at least one detection method.");
        return;
      }
      // Auto-populate name if blank
      if (!this._name) {
        const firstId = this._entityIds[0] ?? "";
        const baseName = firstId.split(".").pop() ?? firstId;
        this._name =
          this._entityIds.length > 1
            ? msg("Anomaly monitor")
            : `${baseName} ${msg("anomalies")}`;
      }
      this._error = "";
      this._step = 3;
    }
  }

  // -------------------------------------------------------------------------
  // Submit
  // -------------------------------------------------------------------------

  private _configPayload(entityId: string) {
    const cfg = this._getEntityConfig(entityId);
    const base: Partial<CreateMonitorPayload> = {
      anomaly_methods: cfg.anomaly_methods,
      anomaly_sensitivity: cfg.anomaly_sensitivity,
      anomaly_rate_window: cfg.anomaly_rate_window,
      anomaly_zscore_window: cfg.anomaly_zscore_window,
      anomaly_persistence_window: cfg.anomaly_persistence_window,
      anomaly_trend_method: cfg.anomaly_trend_method || "rolling_average",
      anomaly_trend_window: cfg.anomaly_trend_window || "24h",
    };
    if (cfg.sample_interval && cfg.sample_interval !== "raw") {
      base.sample_interval = cfg.sample_interval;
      base.sample_aggregate = cfg.sample_aggregate;
      base.anomaly_use_sampled_data = true;
    }
    return base;
  }

  private async _onSubmit() {
    if (!this.hass) return;
    if (!this._name.trim()) {
      this._error = msg("Name is required.");
      return;
    }

    this._saving = true;
    this._error = "";

    try {
      const saved: AnomalyMonitor[] = [];

      if (this.editMonitor) {
        // Edit: use active entity's config
        const cfgEntityId = this._activeEntityId || this._entityIds[0] || "";
        const result = await updateMonitor(this.hass, {
          monitor_id: this.editMonitor.id,
          name: this._name.trim(),
          look_back_hours: this._lookBackHours,
          scan_interval_minutes: this._scanIntervalMinutes,
          ...(this.editMonitor.type === "combined"
            ? { overlap_mode: this._overlapMode }
            : {}),
          ...this._configPayload(cfgEntityId),
        });
        saved.push(result);
      } else if (
        this._monitorType === "combined" ||
        this._entityIds.length === 1
      ) {
        // Single combined sensor (or one entity → always individual)
        const primaryId = this._entityIds[0] ?? "";
        const payload: CreateMonitorPayload = {
          monitor_type: this._entityIds.length > 1 ? "combined" : "individual",
          name: this._name.trim(),
          look_back_hours: this._lookBackHours,
          scan_interval_minutes: this._scanIntervalMinutes,
          ...this._configPayload(primaryId),
        };
        if (this._entityIds.length === 1) {
          payload.entity_id = this._entityIds[0];
        } else {
          payload.entity_ids = [...this._entityIds];
          payload.overlap_mode = this._overlapMode;
        }
        saved.push(await createMonitor(this.hass, payload));
      } else {
        // Individual monitors — one sensor per entity, each with its own config
        const results = await Promise.all(
          this._entityIds.map((entityId) => {
            const baseName = entityId.split(".").pop() ?? entityId;
            return createMonitor(this.hass!, {
              monitor_type: "individual",
              name: `${baseName} ${msg("anomalies")}`,
              entity_id: entityId,
              look_back_hours: this._lookBackHours,
              scan_interval_minutes: this._scanIntervalMinutes,
              ...this._configPayload(entityId),
            });
          })
        );
        saved.push(...results);
      }

      this._emit("dp-monitor-wizard-saved", { monitors: saved });
    } catch (err) {
      this._error = String(err);
    } finally {
      this._saving = false;
    }
  }

  // -------------------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------------------

  private _entityName(entityId: string): string {
    if (!this.hass) return entityId;
    return (
      this.hass.states[entityId]?.attributes?.friendly_name ??
      entityId.split(".").pop() ??
      entityId
    );
  }

  private _overlapOptions() {
    const n = this._entityIds.length;
    const opts: { value: string; label: string }[] = [];
    opts.push({
      value: "all",
      label:
        n <= 2
          ? msg("All anomalies overlap")
          : `${msg("All")} ${n} ${msg("anomalies overlap")}`,
    });
    if (n > 2) {
      for (let i = n - 1; i >= 2; i--) {
        opts.push({
          value: `any_${i}`,
          label: `${msg("Any")} ${i}+ ${msg("entities overlap")}`,
        });
      }
    }
    opts.push({ value: "any", label: msg("Any anomaly from any series") });
    return opts;
  }

  private _saveLabel(): string {
    if (this._saving) return msg("Saving…");
    if (this.editMonitor) return msg("Save changes");
    const count =
      this._monitorType === "combined" || this._entityIds.length <= 1
        ? 1
        : this._entityIds.length;
    return count === 1
      ? msg("Create 1 sensor")
      : `${msg("Create")} ${count} ${msg("sensors")}`;
  }

  // -------------------------------------------------------------------------
  // Render: step indicator
  // -------------------------------------------------------------------------

  private _renderStepBar() {
    const isEdit = !!this.editMonitor;
    if (isEdit) {
      return html`
        <div class="step-bar">
          <span class=${`step${this._step === 2 ? " active" : ""}`}
            >1. ${msg("Analysis")}</span
          >
          <ha-icon icon="mdi:chevron-right" class="step-sep"></ha-icon>
          <span class=${`step${this._step === 3 ? " active" : ""}`}
            >2. ${msg("Schedule")}</span
          >
        </div>
      `;
    }
    return html`
      <div class="step-bar">
        <span class=${`step${this._step === 1 ? " active" : ""}`}
          >1. ${msg("Entities")}</span
        >
        <ha-icon icon="mdi:chevron-right" class="step-sep"></ha-icon>
        <span class=${`step${this._step === 2 ? " active" : ""}`}
          >2. ${msg("Analysis")}</span
        >
        <ha-icon icon="mdi:chevron-right" class="step-sep"></ha-icon>
        <span class=${`step${this._step === 3 ? " active" : ""}`}
          >3. ${msg("Schedule")}</span
        >
      </div>
    `;
  }

  // -------------------------------------------------------------------------
  // Render: step 1 — Entities
  // -------------------------------------------------------------------------

  private _renderStep1() {
    const selectedEntityIds = this._target.entity_id ?? [];
    const suggestions = this.suggestedEntityIds.filter(
      (id) => !selectedEntityIds.includes(id)
    );
    return html`
      <div class="wizard-section">
        <ha-target-picker
          .hass=${this.hass}
          .value=${this._target}
          @value-changed=${this._onTargetChanged}
        ></ha-target-picker>
      </div>

      ${suggestions.length > 0
        ? html`
            <div class="wizard-section">
              <p class="wizard-section-label">
                ${msg("Add from current chart")}
              </p>
              <div class="wizard-entity-chips">
                ${suggestions.map(
                  (id) => html`
                    <button
                      class="suggestion-chip"
                      type="button"
                      @click=${() => this._addSuggestedEntity(id)}
                    >
                      ${this._entityName(id)}
                    </button>
                  `
                )}
              </div>
            </div>
          `
        : nothing}
    `;
  }

  // -------------------------------------------------------------------------
  // Render: step 2 — Analysis (per entity)
  // -------------------------------------------------------------------------

  private _renderStep2() {
    const showTabs = this._entityIds.length > 1;
    const activeId = this._activeEntityId || this._entityIds[0] || "";

    return html`
      ${showTabs
        ? html`
            <div class="entity-tabs">
              ${this._entityIds.map(
                (id) => html`
                  <button
                    class=${`entity-tab${id === activeId ? " active" : ""}`}
                    @click=${() => {
                      this._activeEntityId = id;
                    }}
                  >
                    ${this._entityName(id)}
                  </button>
                `
              )}
            </div>
          `
        : nothing}
      ${activeId ? this._renderEntityAnalysis(activeId) : nothing}
    `;
  }

  private _renderEntityAnalysis(entityId: string) {
    const cfg = this._getEntityConfig(entityId);
    const hasSampling = cfg.sample_interval && cfg.sample_interval !== "raw";

    return html`
      <!-- Downsampling -->
      <div class="wizard-analysis-section">
        <div class="wizard-analysis-section-header">
          <label class="option">
            <input
              type="checkbox"
              .checked=${hasSampling}
              @change=${(e: Event) => {
                const on = (e.target as HTMLInputElement).checked;
                this._updateEntityConfig(
                  entityId,
                  "sample_interval",
                  on ? "5m" : "raw"
                );
              }}
            />
            <span>${msg("Downsampling")}</span>
          </label>
        </div>
        ${hasSampling
          ? html`
              <div class="wizard-analysis-subopts">
                <label class="field">
                  <span class="field-label">${msg("Interval")}</span>
                  <inline-select
                    .value=${cfg.sample_interval}
                    .options=${SAMPLE_INTERVAL_OPTIONS.filter(
                      (o) => o.value !== "raw"
                    ).map((o) => ({ ...o, label: msg(o.label) }))}
                    @dp-select-change=${(e: Event) =>
                      this._updateEntityConfig(
                        entityId,
                        "sample_interval",
                        (e as CustomEvent<{ value: string }>).detail.value
                      )}
                  ></inline-select>
                </label>
                <label class="field">
                  <span class="field-label">${msg("Aggregate")}</span>
                  <inline-select
                    .value=${cfg.sample_aggregate}
                    .options=${SAMPLE_AGGREGATE_OPTIONS.map((o) => ({
                      ...o,
                      label: msg(o.label),
                    }))}
                    @dp-select-change=${(e: Event) =>
                      this._updateEntityConfig(
                        entityId,
                        "sample_aggregate",
                        (e as CustomEvent<{ value: string }>).detail.value
                      )}
                  ></inline-select>
                </label>
                <p class="wizard-notice">
                  ${msg("Detection will run on the downsampled data.")}
                </p>
              </div>
            `
          : nothing}
      </div>

      <!-- Sensitivity -->
      <div class="wizard-analysis-section">
        <label class="field">
          <span class="field-label">${msg("Sensitivity")}</span>
          <inline-select
            .value=${cfg.anomaly_sensitivity}
            .options=${ANALYSIS_ANOMALY_SENSITIVITY_OPTIONS.map((o) => ({
              ...o,
              label: msg(o.label),
            }))}
            @dp-select-change=${(e: Event) =>
              this._updateEntityConfig(
                entityId,
                "anomaly_sensitivity",
                (e as CustomEvent<{ value: string }>).detail.value
              )}
          ></inline-select>
        </label>
      </div>

      <!-- Detection methods -->
      <div class="wizard-analysis-section">
        <p class="wizard-section-label">${msg("Detection methods")}</p>
        <div class="method-list">
          ${ANALYSIS_ANOMALY_METHOD_OPTIONS.filter(
            (o) => o.value !== "comparison_window"
          ).map((opt) => {
            const isChecked = cfg.anomaly_methods.includes(opt.value);
            return html`
              <div class="method-item">
                <label class="option">
                  <input
                    type="checkbox"
                    .checked=${isChecked}
                    @change=${(e: Event) =>
                      this._toggleMethod(
                        entityId,
                        opt.value,
                        (e.target as HTMLInputElement).checked
                      )}
                  />
                  <span>${msg(opt.label)}</span>
                </label>
                ${isChecked
                  ? this._renderMethodSubopts(entityId, opt.value, cfg)
                  : nothing}
              </div>
            `;
          })}
        </div>
      </div>

      <!-- Overlap (when 2+ methods selected) -->
      ${cfg.anomaly_methods.length >= 2
        ? html`
            <div class="wizard-analysis-section">
              <label class="field">
                <span class="field-label">${msg("When methods overlap")}</span>
                <inline-select
                  .value=${cfg.anomaly_sensitivity}
                  .options=${[
                    { value: "all", label: msg("Show all anomalies") },
                    { value: "only", label: msg("Overlaps only") },
                  ]}
                  @dp-select-change=${() => {
                    /* anomaly_overlap_mode is intra-method, not stored per monitor */
                  }}
                ></inline-select>
              </label>
            </div>
          `
        : nothing}
    `;
  }

  private _renderMethodSubopts(
    entityId: string,
    method: string,
    cfg: EntityAnalysisConfig
  ) {
    if (method === "trend_residual") {
      const showWindow = ["rolling_average", "ema", "lowess"].includes(
        cfg.anomaly_trend_method
      );
      return html`
        <div class="wizard-analysis-subopts">
          <label class="field">
            <span class="field-label">${msg("Trend method")}</span>
            <inline-select
              .value=${cfg.anomaly_trend_method}
              .options=${ANALYSIS_TREND_METHOD_OPTIONS.map((o) => ({
                ...o,
                label: msg(o.label),
              }))}
              @dp-select-change=${(e: Event) =>
                this._updateEntityConfig(
                  entityId,
                  "anomaly_trend_method",
                  (e as CustomEvent<{ value: string }>).detail.value
                )}
            ></inline-select>
          </label>
          ${showWindow
            ? html`
                <label class="field">
                  <span class="field-label">${msg("Trend window")}</span>
                  <inline-select
                    .value=${cfg.anomaly_trend_window}
                    .options=${ANALYSIS_TREND_WINDOW_OPTIONS.map((o) => ({
                      ...o,
                      label: msg(o.label),
                    }))}
                    @dp-select-change=${(e: Event) =>
                      this._updateEntityConfig(
                        entityId,
                        "anomaly_trend_window",
                        (e as CustomEvent<{ value: string }>).detail.value
                      )}
                  ></inline-select>
                </label>
              `
            : nothing}
        </div>
      `;
    }
    if (method === "rate_of_change") {
      return html`
        <div class="wizard-analysis-subopts">
          <label class="field">
            <span class="field-label">${msg("Rate window")}</span>
            <inline-select
              .value=${cfg.anomaly_rate_window}
              .options=${ANALYSIS_ANOMALY_RATE_WINDOW_OPTIONS.map((o) => ({
                ...o,
                label: msg(o.label),
              }))}
              @dp-select-change=${(e: Event) =>
                this._updateEntityConfig(
                  entityId,
                  "anomaly_rate_window",
                  (e as CustomEvent<{ value: string }>).detail.value
                )}
            ></inline-select>
          </label>
        </div>
      `;
    }
    if (method === "rolling_zscore") {
      return html`
        <div class="wizard-analysis-subopts">
          <label class="field">
            <span class="field-label">${msg("Rolling window")}</span>
            <inline-select
              .value=${cfg.anomaly_zscore_window}
              .options=${ANALYSIS_ANOMALY_ZSCORE_WINDOW_OPTIONS.map((o) => ({
                ...o,
                label: msg(o.label),
              }))}
              @dp-select-change=${(e: Event) =>
                this._updateEntityConfig(
                  entityId,
                  "anomaly_zscore_window",
                  (e as CustomEvent<{ value: string }>).detail.value
                )}
            ></inline-select>
          </label>
        </div>
      `;
    }
    if (method === "persistence") {
      return html`
        <div class="wizard-analysis-subopts">
          <label class="field">
            <span class="field-label">${msg("Min flat duration")}</span>
            <inline-select
              .value=${cfg.anomaly_persistence_window}
              .options=${ANALYSIS_ANOMALY_PERSISTENCE_WINDOW_OPTIONS.map(
                (o) => ({ ...o, label: msg(o.label) })
              )}
              @dp-select-change=${(e: Event) =>
                this._updateEntityConfig(
                  entityId,
                  "anomaly_persistence_window",
                  (e as CustomEvent<{ value: string }>).detail.value
                )}
            ></inline-select>
          </label>
        </div>
      `;
    }
    return nothing;
  }

  // -------------------------------------------------------------------------
  // Render: step 3 — Schedule
  // -------------------------------------------------------------------------

  private _renderStep3() {
    const entityCount = this._entityIds.length;
    const isMulti = entityCount > 1;

    return html`
      <div class="wizard-section">
        <ha-textfield
          label=${msg("Monitor name")}
          .value=${this._name}
          @input=${(e: Event) => {
            this._name = (e.target as HTMLInputElement).value;
          }}
        ></ha-textfield>
      </div>

      <div class="wizard-inline-row">
        <div class="wizard-field">
          <label class="field-label">${msg("Look-back period")}</label>
          <inline-select
            .value=${String(this._lookBackHours)}
            .options=${LOOK_BACK_OPTIONS.map((o) => ({
              value: String(o.value),
              label: msg(o.label),
            }))}
            @dp-select-change=${(e: Event) => {
              const val = (e as CustomEvent<{ value: string }>).detail?.value;
              if (val) this._lookBackHours = parseInt(val, 10);
            }}
          ></inline-select>
        </div>
        <div class="wizard-field">
          <label class="field-label">${msg("Scan interval")}</label>
          <inline-select
            .value=${String(this._scanIntervalMinutes)}
            .options=${SCAN_INTERVAL_OPTIONS.map((o) => ({
              value: String(o.value),
              label: msg(o.label),
            }))}
            @dp-select-change=${(e: Event) => {
              const val = (e as CustomEvent<{ value: string }>).detail?.value;
              if (val) this._scanIntervalMinutes = parseInt(val, 10);
            }}
          ></inline-select>
        </div>
      </div>

      ${isMulti && !this.editMonitor
        ? html`
            <div class="wizard-field">
              <label class="field-label">${msg("Sensor type")}</label>
              <inline-select
                .value=${this._monitorType}
                .options=${[
                  { value: "individual", label: msg("Individual sensors") },
                  { value: "combined", label: msg("Combined sensor") },
                ]}
                @dp-select-change=${(e: Event) => {
                  const val = (e as CustomEvent<{ value: string }>).detail
                    ?.value as MonitorType;
                  this._monitorType = val;
                  // Reset overlap mode to a sensible default when switching
                  if (val === "combined") this._overlapMode = "all";
                }}
              ></inline-select>
            </div>
          `
        : nothing}
      ${(isMulti || this.editMonitor?.type === "combined") &&
      (this._monitorType === "combined" ||
        this.editMonitor?.type === "combined")
        ? html`
            <div class="wizard-field">
              <label class="field-label">${msg("Overlap mode")}</label>
              <inline-select
                .value=${this._overlapMode}
                .options=${this._overlapOptions()}
                @dp-select-change=${(e: Event) => {
                  const val = (e as CustomEvent<{ value: string }>).detail
                    ?.value;
                  if (val) this._overlapMode = val;
                }}
              ></inline-select>
            </div>
          `
        : nothing}
    `;
  }

  // -------------------------------------------------------------------------
  // Render: root
  // -------------------------------------------------------------------------

  render() {
    const isEdit = !!this.editMonitor;
    const canGoBack =
      (this._step > 1 && !isEdit) || (this._step === 3 && isEdit);

    return html`
      <ha-dialog
        ?open=${this.open}
        hideActions
        .scrimClickAction=${"close"}
        .escapeKeyAction=${"close"}
        @closed=${this._onDialogClosed}
      >
        <span slot="heading">
          ${isEdit ? msg("Edit monitor") : msg("Create monitor")}
        </span>

        <div class="wizard-content">
          ${this._renderStepBar()}
          ${this._step === 1 ? this._renderStep1() : nothing}
          ${this._step === 2 ? this._renderStep2() : nothing}
          ${this._step === 3 ? this._renderStep3() : nothing}
          ${this._error
            ? html`<div class="wizard-error">${this._error}</div>`
            : nothing}

          <div class="dialog-actions">
            <ha-button @click=${this._onClose}>${msg("Cancel")}</ha-button>
            <span class="dialog-spacer"></span>
            ${canGoBack
              ? html`<ha-button @click=${this._onBack}
                  >${msg("Back")}</ha-button
                >`
              : nothing}
            ${this._step < 3
              ? html`<ha-button raised @click=${this._onNext}
                  >${msg("Next")}</ha-button
                >`
              : html`<ha-button
                  raised
                  .disabled=${this._saving}
                  @click=${this._onSubmit}
                  >${this._saveLabel()}</ha-button
                >`}
          </div>
        </div>
      </ha-dialog>
    `;
  }
}

customElements.define("anomaly-monitor-wizard", AnomalyMonitorWizard);

declare global {
  interface HTMLElementTagNameMap {
    "anomaly-monitor-wizard": AnomalyMonitorWizard;
  }
}

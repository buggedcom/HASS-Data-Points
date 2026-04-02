import {
  areaIcon,
  areaName,
  deviceIcon,
  deviceName,
  DOMAIN,
  entityIcon,
  entityName,
  esc,
  invalidateEventsCache,
  labelIcon,
  labelName,
  mergeTargetSelections,
  normalizeTargetSelection,
} from "@/lib/shared.js";
import { logger } from "@/lib/logger.js";

/**
 * Dedicated annotation dialog controller for the history chart card.
 */

export class HistoryAnnotationDialogController {
  constructor(host) {
    this._host = host;
    this._dialogEl = null;
    this._panelEl = null;
    this._chipRowEl = null;
    this._linkedTarget = {};
    this._target = {};
  }

  isOpen() {
    return !!this._dialogEl?.open;
  }

  ensureDialog() {
    if (this._dialogEl || !this._host.shadowRoot) {
      return;
    }
    const dialog = document.createElement("ha-dialog");
    dialog.id = "chart-context-dialog";
    dialog.scrimClickAction = true;
    dialog.escapeKeyAction = true;
    dialog.open = false;
    dialog.headerTitle = "Create data point";
    dialog.style.setProperty("--dialog-content-padding", "0 var(--dp-spacing-lg, 24px) var(--dp-spacing-lg, 24px)");
    dialog.style.setProperty("--mdc-dialog-min-width", "min(920px, 96vw)");
    dialog.style.setProperty("--mdc-dialog-max-width", "96vw");
    if (this._host._hass) {
      dialog.hass = this._host._hass;
    }
    dialog.innerHTML = `
      <div id="chart-context-dialog-panel" class="chart-context-dialog-panel"></div>
    `;
    dialog.addEventListener("closed", () => this.finalizeClose());
    this._host.shadowRoot.appendChild(dialog);
    this._dialogEl = dialog;
    this._panelEl = dialog.querySelector("#chart-context-dialog-panel");
  }

  teardown() {
    this.resetFormState();
    this._dialogEl?.remove();
    this._dialogEl = null;
    this._panelEl = null;
    this._chipRowEl = null;
  }

  resetFormState() {
    this._linkedTarget = {};
    this._target = {};
  }

  finalizeClose() {
    this.teardown();
    this._host._creatingContextAnnotation = false;
  }

  formatDate(timeMs) {
    const value = new Date(timeMs);
    const yyyy = value.getFullYear();
    const mm = String(value.getMonth() + 1).padStart(2, "0");
    const dd = String(value.getDate()).padStart(2, "0");
    const hh = String(value.getHours()).padStart(2, "0");
    const min = String(value.getMinutes()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
  }

  _buildChips(target) {
    return [
      ...(target.entity_id || []).map((id) => ({
        type: "entity_id",
        itemId: id,
        icon: entityIcon(this._host._hass, id),
        name: entityName(this._host._hass, id),
      })),
      ...(target.device_id || []).map((id) => ({
        type: "device_id",
        itemId: id,
        icon: deviceIcon(this._host._hass, id),
        name: deviceName(this._host._hass, id),
      })),
      ...(target.area_id || []).map((id) => ({
        type: "area_id",
        itemId: id,
        icon: areaIcon(this._host._hass, id),
        name: areaName(this._host._hass, id),
      })),
      ...(target.label_id || []).map((id) => ({
        type: "label_id",
        itemId: id,
        icon: labelIcon(this._host._hass, id),
        name: labelName(this._host._hass, id),
      })),
    ];
  }

  removeLinkedTarget(type, id) {
    if (!this._linkedTarget || !type || !id) {
      return;
    }
    const current = normalizeTargetSelection(this._linkedTarget);
    if (!current[type]) {
      return;
    }
    current[type] = current[type].filter((value) => value !== id);
    this._linkedTarget = current;
    if (this._chipRowEl) {
      this._chipRowEl.chips = this._buildChips(this._linkedTarget);
    }
  }

  bindTargetChipActions() {
    // No-op: chip remove events are handled via dp-target-remove on _chipRowEl.
  }

  bindFields(hover) {
    if (!this._panelEl) {
      return;
    }
    const prefill = hover?.annotationPrefill && typeof hover.annotationPrefill === "object"
      ? hover.annotationPrefill
      : {};
    const messageEl = this._panelEl.querySelector("#chart-context-message");
    const annotationEl = this._panelEl.querySelector("#chart-context-annotation");
    const iconPicker = this._panelEl.querySelector("#chart-context-icon");
    if (iconPicker) {
      iconPicker.hass = this._host._hass;
      iconPicker.value = prefill.icon || hover?.event?.icon || "mdi:bookmark";
    }
    const targetSel = this._panelEl.querySelector("#chart-context-target");
    if (targetSel) {
      targetSel.hass = this._host._hass;
      targetSel.value = {};
      targetSel.addEventListener("value-changed", (ev) => {
        this._target = normalizeTargetSelection(ev.detail.value || {});
      });
    }
    if (messageEl) {
      messageEl.value = prefill.message || "";
    }
    if (annotationEl) {
      annotationEl.value = prefill.annotation || "";
    }

    // Mount dp-annotation-chip-row into the #chart-context-linked-targets placeholder.
    const chipContainer = this._panelEl.querySelector("#chart-context-linked-targets");
    if (chipContainer && !this._chipRowEl) {
      const chipRow = document.createElement("dp-annotation-chip-row");
      chipRow.addEventListener("dp-target-remove", (ev) => {
        this.removeLinkedTarget(ev.detail.type, ev.detail.id);
      });
      chipContainer.appendChild(chipRow);
      this._chipRowEl = chipRow;
    }
    if (this._chipRowEl) {
      this._chipRowEl.chips = this._buildChips(this._linkedTarget);
    }

    this.bindTargetChipActions();
    const colorInput = this._panelEl.querySelector("#chart-context-color");
    const colorPreview = this._panelEl.querySelector("#chart-context-color-preview");
    const syncColor = () => {
      if (colorPreview && colorInput) {
        colorPreview.style.background = colorInput.value;
      }
    };
    if (colorInput) {
      syncColor();
      colorInput.addEventListener("input", syncColor);
      colorInput.addEventListener("change", syncColor);
    }
    this._dialogEl?.querySelector("#chart-context-cancel")
      ?.addEventListener("click", () => this.close());
    this._dialogEl?.querySelector("#chart-context-save")
      ?.addEventListener("click", () => this.submit());
    [messageEl, annotationEl].forEach((field) => {
      field?.addEventListener("keydown", (ev) => {
        if (ev.key === "Enter" && (ev.ctrlKey || ev.metaKey)) {
          ev.preventDefault();
          this.submit();
        }
      });
    });
  }

  async submit() {
    if (!this._panelEl || !this._host._hass) {
      return;
    }
    const messageEl = this._panelEl.querySelector("#chart-context-message");
    const annotationEl = this._panelEl.querySelector("#chart-context-annotation");
    const dateEl = this._panelEl.querySelector("#chart-context-date");
    const iconPicker = this._panelEl.querySelector("#chart-context-icon");
    const colorInput = this._panelEl.querySelector("#chart-context-color");
    const saveButton = this._dialogEl?.querySelector("#chart-context-save");
    const feedbackEl = this._panelEl.querySelector("#chart-context-feedback");

    const message = (messageEl?.value || "").trim();
    if (!message) {
      messageEl?.focus();
      return;
    }

    const mergedTarget = mergeTargetSelections(this._linkedTarget, this._target || {});
    const payload = { message };
    const annotation = (annotationEl?.value || "").trim();
    if (annotation) {
      payload.annotation = annotation;
    }
    const dateVal = (dateEl?.value || "").trim();
    if (dateVal) {
      const parsedDate = new Date(dateVal);
      payload.date = Number.isFinite(parsedDate.getTime())
        ? parsedDate.toISOString()
        : dateVal;
    }
    const icon = iconPicker?.value;
    if (icon) {
      payload.icon = icon;
    }
    payload.color = colorInput?.value || "#03a9f4";
    if (mergedTarget.entity_id.length) {
      payload.entity_ids = mergedTarget.entity_id;
    }
    if (mergedTarget.device_id.length) {
      payload.device_ids = mergedTarget.device_id;
    }
    if (mergedTarget.area_id.length) {
      payload.area_ids = mergedTarget.area_id;
    }
    if (mergedTarget.label_id.length) {
      payload.label_ids = mergedTarget.label_id;
    }

    if (saveButton) saveButton.disabled = true;
    if (feedbackEl) {
      feedbackEl.hidden = true;
      feedbackEl.textContent = "";
    }
    try {
      await this._host._hass.callService(DOMAIN, "record", payload);
      invalidateEventsCache();
      window.dispatchEvent(new CustomEvent("hass-datapoints-event-recorded"));
      this.close();
    } catch (err) {
      if (feedbackEl) {
        feedbackEl.hidden = false;
        feedbackEl.textContent = err?.message || "Failed to create annotation.";
      }
      logger.error("[hass-datapoints history-card]", err);
    } finally {
      if (saveButton) saveButton.disabled = false;
    }
  }

  open(hover) {
    if (this._dialogEl && !this._dialogEl.open) {
      this.teardown();
    }
    this.ensureDialog();
    if (!this._dialogEl || !this._panelEl || this._dialogEl.open) return;
    this.resetFormState();
    const prefillLinkedTarget = hover?.annotationPrefill?.linkedTarget;
    if (prefillLinkedTarget && typeof prefillLinkedTarget === "object") {
      this._linkedTarget = normalizeTargetSelection(prefillLinkedTarget);
    } else {
      this._linkedTarget = normalizeTargetSelection({ entity_id: this._host._entityIds.filter(Boolean) });
    }
    const defaultColor = hover?.annotationPrefill?.color || hover?.primary?.color || hover?.event?.color || "#03a9f4";

    this._panelEl.innerHTML = `
      <style>
        .chart-context-dialog-panel { width: min(920px, 96vw); max-width: 100%; color: var(--primary-text-color); }
        .context-dialog-content { display: grid; gap: 16px; padding-top: 4px; }
        .context-form { display: grid; gap: 16px; }
        .context-form-grid { display: grid; grid-template-columns: minmax(0, 1fr); gap: 16px; }
        .context-form-main, .context-form-side { display: grid; gap: 16px; min-width: 0; }
        .context-form-side { align-content: start; justify-items: start; }
        .context-form-field { display: grid; gap: 6px; min-width: 0; }
        .context-form-field.compact-field { justify-items: start; }
        .context-form-label { font-size: 0.9rem; font-weight: 600; color: var(--primary-text-color); }
        .context-form-help { font-size: 0.8rem; color: var(--secondary-text-color); line-height: 1.45; }
        .context-form-help-inline { display: inline-flex; align-items: center; gap: 6px; }
        .context-annotation-input { width: 100%; min-height: 120px; box-sizing: border-box; resize: vertical; padding: 12px; border: 1px solid var(--input-outlined-idle-border-color, var(--divider-color, #9e9e9e)); border-radius: 12px; background: var(--card-background-color, var(--primary-background-color, #fff)); color: var(--primary-text-color); font: inherit; line-height: 1.45; }
        .context-annotation-input::placeholder { color: var(--secondary-text-color); }
        .context-annotation-input:focus { outline: none; border-color: var(--primary-color); box-shadow: 0 0 0 1px var(--primary-color); }
        .context-help-icon { color: var(--secondary-text-color); cursor: help; --mdc-icon-size: 16px; }
        .context-chip-row { display: flex; flex-wrap: wrap; gap: 6px; }
        .context-chip { display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; border-radius: 999px; background: color-mix(in srgb, var(--primary-color) 12%, transparent); color: var(--primary-color); white-space: nowrap; }
        .context-chip ha-icon { --mdc-icon-size: 14px; }
        .context-chip-remove { display: inline-flex; align-items: center; justify-content: center; width: 20px; height: 20px; padding: 0; border: none; border-radius: 50%; background: transparent; color: currentColor; cursor: pointer; flex: 0 0 auto; }
        .context-chip-remove:hover { background: color-mix(in srgb, currentColor 12%, transparent); }
        .context-chip-remove ha-icon { --mdc-icon-size: 12px; pointer-events: none; }
        .context-color-control { display: flex; align-items: center; gap: 10px; }
        .context-color-preview { width: 28px; height: 28px; border-radius: 50%; border: 2px solid var(--divider-color, #ccc); background: ${esc(defaultColor)}; flex: 0 0 auto; }
        .context-color-input { width: 56px; height: 36px; padding: 0; border: none; background: transparent; cursor: pointer; }
        .context-date-input { width: 220px; max-width: 100%; }
        .context-icon-input { width: 220px; max-width: 100%; }
        .context-form-feedback { color: var(--error-color); font-size: 0.84rem; }
        .context-form-footer { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding-top: 8px; }
        .context-form-actions { display: flex; align-items: center; justify-content: flex-end; gap: 8px; margin-left: auto; }
      </style>
      <div class="context-dialog-content">
        <div class="context-form">
          <div class="context-form-grid">
            <div class="context-form-main">
              <div class="context-form-field">
                <label class="context-form-label" for="chart-context-message">Message</label>
                <div class="context-form-help">Use a short title that will be shown in the chart tooltip and records list.</div>
                <ha-textfield id="chart-context-message" placeholder="What happened?" style="width:100%"></ha-textfield>
              </div>
              <div class="context-form-field">
                <label class="context-form-label" for="chart-context-annotation">Annotation</label>
                <div class="context-form-help">Add any longer context, outcome, or note you want to keep with this data point.</div>
                <textarea id="chart-context-annotation" class="context-annotation-input" placeholder="Detailed note shown on chart hover..."></textarea>
              </div>
              <div id="chart-context-linked-targets"></div>
              <div class="context-form-field">
                <label class="context-form-label" for="chart-context-target">Additional related items</label>
                <div class="context-form-help">Optionally add more entities, devices, areas, or labels that should also be linked to this annotation.</div>
                <ha-selector id="chart-context-target"></ha-selector>
              </div>
            </div>
            <div class="context-form-side">
              <div class="context-form-field compact-field">
                <label class="context-form-label" for="chart-context-date">Date and time</label>
                <div class="context-form-help">The annotation will be placed at this exact moment on the chart.</div>
                <ha-textfield id="chart-context-date" class="context-date-input" type="datetime-local" value="${esc(this.formatDate(hover.timeMs))}"></ha-textfield>
              </div>
              <div class="context-form-field compact-field">
                <label class="context-form-label" for="chart-context-icon">Icon</label>
                <div class="context-form-help">Choose the icon shown for this data point in the chart and records list.</div>
                <ha-icon-picker id="chart-context-icon" class="context-icon-input" label="Icon"></ha-icon-picker>
              </div>
              <div class="context-form-field">
                <label class="context-form-label" for="chart-context-color">Color</label>
                <div class="context-form-help context-form-help-inline">
                  Pick a color for the point marker and its related timeline indicators.
                  <ha-icon class="context-help-icon" icon="mdi:information-outline" title="This color is used for the chart marker, timeline dot, and record icon."></ha-icon>
                </div>
                <div class="context-color-control">
                  <span id="chart-context-color-preview" class="context-color-preview" aria-hidden="true"></span>
                  <input id="chart-context-color" class="context-color-input" type="color" value="${esc(defaultColor)}" aria-label="Annotation color">
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="context-form-footer">
          <div id="chart-context-feedback" class="context-form-feedback" hidden></div>
          <div class="context-form-actions">
            <ha-button id="chart-context-cancel">Cancel</ha-button>
            <ha-button id="chart-context-save" raised>Create data point</ha-button>
          </div>
        </div>
      </div>
    `;
    if (this._dialogEl) {
      this._dialogEl.hass = this._host._hass;
      this._dialogEl.dialogInitialFocus = "#chart-context-message";
    }
    const targetSel = this._panelEl.querySelector("#chart-context-target");
    if (targetSel) targetSel.selector = { target: {} };
    this.bindFields(hover);
    this._dialogEl.open = true;
    this._host._creatingContextAnnotation = true;
    window.requestAnimationFrame(() => {
      this._panelEl?.querySelector("#chart-context-message")?.focus?.();
    });
  }

  close() {
    this._host._creatingContextAnnotation = false;
    if (this._dialogEl) this._dialogEl.open = false;
    window.setTimeout(() => this.finalizeClose(), 0);
  }
}

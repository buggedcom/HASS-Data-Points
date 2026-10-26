import { css } from "lit";

import { targetPickerWidthCss } from "@/lib/ui/target-picker-width";

export const styles = css`
  /* ---- Dialog content wrapper ---- */

  .wizard-shell {
    display: flex;
    flex-direction: column;
    /* Shared with the sidebar target picker so both present at one width. */
    min-width: ${targetPickerWidthCss};
    max-height: 70vh;
  }

  .wizard-header {
    flex: 0 0 auto;
    background: var(--card-background-color, #fff);
    padding: 0 2px;
  }

  .wizard-content {
    display: flex;
    flex-direction: column;
    gap: 14px;
    flex: 1 1 auto;
    overflow-y: auto;
    padding: 0 2px 6px;
  }

  /* ---- Step indicator bar ---- */

  .step-bar {
    display: flex;
    align-items: center;
    gap: 4px;
    position: sticky;
    top: 0;
    z-index: 1;
    padding: 0 0 10px;
    border-bottom: 1px solid var(--divider-color, rgba(0, 0, 0, 0.12));
    background: var(--card-background-color, #fff);
  }

  .step-dot {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 2px 4px;
    border: 0;
    border-radius: 999px;
    background: transparent;
    color: var(--secondary-text-color);
    font: inherit;
    font-size: 0.82rem;
    white-space: nowrap;
    cursor: pointer;
    appearance: none;
    -webkit-appearance: none;
  }

  .step-dot:disabled {
    cursor: default;
    opacity: 0.6;
  }

  .step-dot:focus-visible {
    outline: 2px solid var(--primary-color);
    outline-offset: 2px;
  }

  .step-dot-circle {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    border: 2px solid var(--divider-color, rgba(0, 0, 0, 0.2));
    font-size: 0.78rem;
    font-weight: 600;
    --mdc-icon-size: 14px;
    flex-shrink: 0;
  }

  .step-dot.active {
    color: var(--primary-color);
    font-weight: 600;
  }

  .step-dot.active .step-dot-circle {
    border-color: var(--primary-color);
  }

  .step-dot.done {
    color: var(--primary-text-color);
  }

  .step-dot.done .step-dot-circle {
    border-color: var(--primary-color);
    background: var(--primary-color);
    color: var(--text-primary-color, #fff);
  }

  .step-line {
    flex: 1 1 16px;
    min-width: 12px;
    height: 2px;
    background: var(--divider-color, rgba(0, 0, 0, 0.12));
  }

  /* ---- Step 1: info note ---- */

  .step-info-note {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    margin: 0;
    font-size: 0.82rem;
    line-height: 1.4;
    color: var(--secondary-text-color);
    --mdc-icon-size: 18px;
  }

  /* ---- Step 2: tab badge + copy-from ---- */

  .tab-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 18px;
    height: 18px;
    margin-left: 8px;
    padding: 0 5px;
    border-radius: 999px;
    background: color-mix(in srgb, var(--primary-color) 16%, transparent);
    color: var(--primary-color);
    font-size: 0.72rem;
    font-weight: 600;
  }

  .copy-from {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
    margin-bottom: 8px;
    --mdc-icon-size: 16px;
    color: var(--secondary-text-color);
  }

  /* ---- Step 3: radio cards, hints, summary ---- */

  .radio-cards {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 10px;
  }

  .radio-card {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 14px;
    border: 1px solid var(--divider-color, rgba(0, 0, 0, 0.12));
    border-radius: 10px;
    background: transparent;
    color: var(--primary-text-color);
    font: inherit;
    text-align: left;
    cursor: pointer;
    appearance: none;
    -webkit-appearance: none;
  }

  .radio-card:focus-visible {
    outline: 2px solid var(--primary-color);
    outline-offset: 2px;
  }

  .radio-card.checked {
    border-color: var(--primary-color);
    background: color-mix(in srgb, var(--primary-color) 8%, transparent);
  }

  .radio-card-dot {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    border: 2px solid var(--secondary-text-color);
    flex-shrink: 0;
    box-sizing: border-box;
  }

  .radio-card.checked .radio-card-dot {
    border-color: var(--primary-color);
    border-width: 5px;
  }

  .radio-card-text {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .radio-card-title {
    font-size: 0.9rem;
    font-weight: 500;
  }

  .radio-card-subtitle {
    font-size: 0.78rem;
    color: var(--secondary-text-color);
  }

  .name-hint,
  .overlap-help {
    margin: 0;
    font-size: 0.78rem;
    line-height: 1.4;
    color: var(--secondary-text-color);
  }

  .overlap-help {
    padding-left: 16px;
  }

  .overlap-help li.selected {
    color: var(--primary-text-color);
  }

  .summary-row {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 12px;
    border-radius: 8px;
    background: color-mix(in srgb, var(--primary-color) 8%, transparent);
    font-size: 0.86rem;
    font-weight: 500;
    --mdc-icon-size: 18px;
  }

  /* ---- Narrow / mobile: full-screen modal ---- */

  @media (max-width: 600px) {
    ha-dialog {
      --mdc-dialog-min-width: 100vw;
      --mdc-dialog-max-width: 100vw;
      --mdc-dialog-min-height: 100dvh;
      --mdc-dialog-max-height: 100dvh;
      --dialog-surface-margin: 0px;
      --dialog-surface-position: fixed;
      --vertical-align-dialog: flex-start;
      --ha-dialog-border-radius: 0px;
    }

    .wizard-shell {
      min-width: 0;
      max-height: none;
      height: calc(100dvh - 96px);
    }

    .step-dot-label {
      display: none;
    }

    .step-dot.active .step-dot-label {
      display: inline;
    }
  }

  /* ---- Generic sections ---- */

  .wizard-section {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .wizard-section-label {
    margin: 0;
    font-size: 0.78rem;
    font-weight: 500;
    color: var(--secondary-text-color);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  /* ---- Entity chips ---- */

  .wizard-entity-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
  }

  .quick-add-btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    min-height: 34px;
    padding: 8px 14px;
    border: 0;
    border-radius: 999px;
    background: color-mix(
      in srgb,
      var(--primary-color, #3b82f6) 18%,
      transparent
    );
    color: var(--primary-color, #3b82f6);
    font: inherit;
    font-size: 0.84rem;
    font-weight: 500;
    cursor: pointer;
    --mdc-icon-size: 16px;
    appearance: none;
    -webkit-appearance: none;
    transition: background 120ms ease;
  }

  .quick-add-btn:hover,
  .quick-add-btn:focus-visible {
    background: color-mix(
      in srgb,
      var(--primary-color, #3b82f6) 26%,
      transparent
    );
    outline: none;
  }

  /* ---- Step 2: Entity tabs ---- */

  .entity-tabs {
    display: flex;
    gap: 0;
    overflow-x: auto;
    flex-wrap: nowrap;
    scrollbar-width: thin;
    border-bottom: 2px solid var(--divider-color, rgba(0, 0, 0, 0.12));
  }

  .entity-tab {
    display: inline-flex;
    align-items: center;
    padding: 8px 14px;
    border: none;
    border-bottom: 2px solid transparent;
    margin-bottom: -2px;
    border-radius: 6px 6px 0 0;
    background: transparent;
    color: var(--secondary-text-color);
    font: inherit;
    font-size: 0.85rem;
    white-space: nowrap;
    cursor: pointer;
    flex-shrink: 0;
    transition:
      color 120ms ease,
      border-color 120ms ease,
      background 120ms ease;
    appearance: none;
    -webkit-appearance: none;
  }

  .entity-tab:hover {
    color: var(--primary-color);
    background: color-mix(in srgb, var(--primary-color) 5%, transparent);
  }

  .entity-tab.active {
    color: var(--primary-color);
    border-bottom-color: var(--primary-color);
    font-weight: 500;
  }

  .entity-tab-panel {
    border: 1px solid var(--divider-color, rgba(0, 0, 0, 0.12));
    border-top: none;
    border-radius: 0 0 8px 8px;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  /* ---- Step 2: Analysis sections ---- */

  .wizard-analysis-section {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 10px 12px;
    border: 1px solid var(--divider-color, rgba(0, 0, 0, 0.08));
    border-radius: 8px;
  }

  .wizard-analysis-section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .wizard-analysis-subopts {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding-left: 20px;
    border-left: 2px solid var(--divider-color, rgba(0, 0, 0, 0.08));
    margin-left: 4px;
  }

  /* ---- Method list ---- */

  .method-list {
    display: grid;
    gap: 8px;
  }

  .method-item {
    display: grid;
    gap: 6px;
  }

  /* ---- Form elements ---- */

  .field {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }

  .field-label {
    font-size: 0.82rem;
    color: var(--secondary-text-color);
    flex-shrink: 0;
  }

  .option {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.85rem;
    cursor: pointer;
  }

  /* ---- Step 3 ---- */

  .wizard-inline-row {
    display: flex;
    gap: 16px;
    flex-wrap: wrap;
  }

  .wizard-field {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  ha-textfield {
    width: 100%;
  }

  /* ---- Notice ---- */

  .wizard-notice {
    margin: 4px 0 0;
    font-size: 0.8rem;
    color: var(--secondary-text-color);
  }

  .wizard-notice-info {
    padding: 10px 12px;
    border-radius: 8px;
    border: 1px solid var(--info-color, #2196f3);
    background: color-mix(in srgb, var(--info-color, #2196f3) 8%, transparent);
    font-size: 0.84rem;
    color: var(--primary-text-color);
    line-height: 1.5;
    margin: 0;
  }

  /* ---- Error ---- */

  .wizard-error {
    color: var(--error-color, #f44336);
    font-size: 0.84rem;
    padding: 6px 0;
  }

  /* ---- Footer actions ---- */

  .dialog-actions {
    display: flex;
    align-items: center;
    gap: 4px;
    flex: 0 0 auto;
    padding-top: 8px;
    border-top: 1px solid var(--divider-color, rgba(0, 0, 0, 0.08));
    margin-top: 6px;
  }

  .dialog-spacer {
    flex: 1;
  }
`;

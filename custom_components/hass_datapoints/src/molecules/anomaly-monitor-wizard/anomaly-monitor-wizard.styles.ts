import { css } from "lit";

export const styles = css`
  /* ---- Dialog content wrapper ---- */

  .wizard-content {
    display: flex;
    flex-direction: column;
    gap: 16px;
    min-width: min(480px, 90vw);
    max-height: 70vh;
    overflow-y: auto;
    padding: 0 2px 4px;
  }

  /* ---- Step indicator bar ---- */

  .step-bar {
    display: flex;
    align-items: center;
    gap: 4px;
    padding-bottom: 8px;
    border-bottom: 1px solid var(--divider-color, rgba(0, 0, 0, 0.12));
    margin-bottom: 4px;
  }

  .step {
    font-size: 0.82rem;
    color: var(--secondary-text-color);
    padding: 3px 8px;
    border-radius: 4px;
    white-space: nowrap;
  }

  .step.active {
    color: var(--primary-color);
    font-weight: 600;
    background: color-mix(in srgb, var(--primary-color) 10%, transparent);
  }

  .step-sep {
    --mdc-icon-size: 14px;
    color: var(--divider-color, rgba(0, 0, 0, 0.2));
    flex-shrink: 0;
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
    gap: 6px;
    align-items: center;
  }

  .suggestion-chip {
    cursor: pointer;
    opacity: 0.75;
    transition: opacity 120ms ease;
  }

  .suggestion-chip:hover {
    opacity: 1;
  }

  /* ---- Step 2: Entity tabs ---- */

  .entity-tabs {
    display: flex;
    gap: 6px;
    overflow-x: auto;
    padding-bottom: 6px;
    flex-wrap: nowrap;
    scrollbar-width: thin;
  }

  .entity-tab {
    display: inline-flex;
    align-items: center;
    padding: 4px 10px;
    border: 1.5px solid var(--divider-color, rgba(0, 0, 0, 0.12));
    border-radius: 12px;
    background: transparent;
    color: var(--secondary-text-color);
    font: inherit;
    font-size: 0.82rem;
    white-space: nowrap;
    cursor: pointer;
    flex-shrink: 0;
    transition: border-color 120ms ease, color 120ms ease, background 120ms ease;
    appearance: none;
    -webkit-appearance: none;
  }

  .entity-tab:hover {
    border-color: var(--primary-color);
    color: var(--primary-color);
  }

  .entity-tab.active {
    border-color: var(--primary-color);
    color: var(--primary-color);
    background: color-mix(in srgb, var(--primary-color) 8%, transparent);
    font-weight: 500;
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
    padding-top: 8px;
    border-top: 1px solid var(--divider-color, rgba(0, 0, 0, 0.08));
    margin-top: 4px;
  }

  .dialog-spacer {
    flex: 1;
  }
`;

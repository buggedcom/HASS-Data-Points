import { css } from "lit";

export const styles = css`
  :host {
    --dp-spacing-xs: calc(var(--spacing, 8px) * 0.5);
    --dp-spacing-sm: var(--spacing, 8px);
    --dp-spacing-md: calc(var(--spacing, 8px) * 1.5);
    --dp-spacing-lg: calc(var(--spacing, 8px) * 2);
  }

  /* --------------------------------------------------------------------------
   * Layout: type tabs · one-line hint · that type's fields · optional name ·
   * actions. Each section owns its own vertical rhythm via the content grid.
   * ------------------------------------------------------------------------ */
  .date-window-dialog-content {
    display: grid;
    gap: var(--dp-spacing-lg);
    padding: 0;
    overflow: visible;
  }

  .date-window-dialog-panel {
    display: grid;
    gap: var(--dp-spacing-lg);
  }

  /* Type tabs (Relative first). */
  .date-window-dialog-tabs {
    display: flex;
    border-bottom: 1px solid var(--divider-color, rgba(0, 0, 0, 0.12));
  }

  .date-window-dialog-tab {
    flex: 1 1 0;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--dp-spacing-sm);
    padding: 14px 8px 12px;
    border: none;
    background: none;
    color: var(--secondary-text-color);
    font: inherit;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
  }

  .date-window-dialog-tab ha-icon {
    --mdc-icon-size: 18px;
  }

  .date-window-dialog-tab:hover {
    color: var(--primary-text-color);
    background: color-mix(
      in srgb,
      var(--primary-text-color, #212121) 4%,
      transparent
    );
  }

  .date-window-dialog-tab[aria-selected="true"] {
    color: var(--primary-color, #03a9f4);
  }

  .date-window-dialog-tab[aria-selected="true"]::after {
    content: "";
    position: absolute;
    left: 16px;
    right: 16px;
    bottom: -1px;
    height: 3px;
    border-radius: 3px 3px 0 0;
    background: var(--primary-color, #03a9f4);
  }

  .date-window-dialog-tab:focus-visible,
  .date-window-dialog-chip:focus-visible {
    outline: 2px solid var(--primary-color, #03a9f4);
    outline-offset: 2px;
  }

  .date-window-dialog-hint {
    margin: 0;
    color: var(--secondary-text-color);
    line-height: 1.5;
  }

  .date-window-dialog-field {
    display: grid;
    gap: 6px;
    overflow: visible;
  }

  .date-window-dialog-field label {
    font-size: 0.8125rem;
    font-weight: 500;
    color: var(--secondary-text-color);
  }

  .date-window-dialog-optional {
    font-weight: 400;
    opacity: 0.8;
  }

  .date-window-dialog-dates {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--dp-spacing-md);
  }

  .date-window-dialog-input {
    width: 100%;
    min-height: 44px;
    padding: 0 14px;
    border: 1px solid var(--divider-color, rgba(0, 0, 0, 0.12));
    border-radius: 10px;
    background: var(--secondary-background-color, #f5f5f5);
    color: var(--primary-text-color);
    font: inherit;
    box-sizing: border-box;
  }

  .date-window-dialog-input:focus {
    outline: 2px solid var(--primary-color, #03a9f4);
    outline-offset: -1px;
    border-color: transparent;
  }

  .date-window-dialog-input[aria-invalid="true"] {
    border-color: var(--error-color, #db4437);
  }

  .date-window-dialog-length {
    margin: calc(var(--dp-spacing-sm) * -1) 0 0;
    font-size: 0.8125rem;
    color: var(--secondary-text-color);
  }

  .date-window-dialog-error {
    color: var(--error-color, #db4437);
  }

  /* "Fill from" chips (fixed dates only). */
  .date-window-dialog-chips {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--dp-spacing-sm);
  }

  .date-window-dialog-chips-label {
    margin-right: 4px;
    font-size: 0.8125rem;
    color: var(--secondary-text-color);
  }

  .date-window-dialog-chip {
    padding: 7px 14px;
    border: 1px solid var(--divider-color, rgba(0, 0, 0, 0.12));
    border-radius: 999px;
    background: transparent;
    color: var(--primary-text-color);
    font: inherit;
    font-size: 0.8125rem;
    cursor: pointer;
  }

  .date-window-dialog-chip:hover {
    background: var(--secondary-background-color, #f5f5f5);
  }

  /* Relative preview: selected range vs this window, plus a position strip. */
  .date-window-dialog-preview {
    display: grid;
    gap: 10px;
    padding: 14px 16px;
    border: 1px solid var(--divider-color, rgba(0, 0, 0, 0.12));
    border-radius: 14px;
    background: var(--secondary-background-color, #f5f5f5);
  }

  .date-window-dialog-preview-row {
    display: grid;
    grid-template-columns: 12px 110px minmax(0, 1fr);
    align-items: center;
    gap: 10px;
  }

  .date-window-dialog-preview-row .swatch {
    width: 12px;
    height: 12px;
    border-radius: 3px;
  }

  .date-window-dialog-preview-row .key {
    color: var(--secondary-text-color);
  }

  .date-window-dialog-preview-row .value {
    font-weight: 500;
    font-variant-numeric: tabular-nums;
  }

  .is-selected {
    background: var(--primary-color, #03a9f4);
  }

  .is-window {
    background: var(--warning-color, #f5a54a);
  }

  .date-window-dialog-strip {
    position: relative;
    height: 10px;
    margin-top: 4px;
    border-radius: 5px;
    background: color-mix(
      in srgb,
      var(--primary-text-color, #212121) 10%,
      transparent
    );
  }

  .date-window-dialog-strip span {
    position: absolute;
    top: 0;
    bottom: 0;
    border-radius: 5px;
  }

  .date-window-dialog-strip .is-window {
    opacity: 0.9;
  }

  .date-window-dialog-preview-note {
    margin: 0;
    font-size: 0.8125rem;
    color: var(--secondary-text-color);
  }

  /* --------------------------------------------------------------------------
   * Actions — Delete sits apart on the left (destructive), Cancel + the primary
   * Create/Save button are grouped on the right. A hairline separates the row.
   * ------------------------------------------------------------------------ */
  .date-window-dialog-actions {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--dp-spacing-sm);
    padding-top: var(--dp-spacing-md);
    border-top: 1px solid
      color-mix(
        in srgb,
        var(--divider-color, rgba(0, 0, 0, 0.12)) 60%,
        transparent
      );
  }

  .date-window-dialog-actions-right {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: var(--dp-spacing-sm);
    margin-left: auto;
  }

  .date-window-dialog-actions ha-button {
    --mdc-typography-button-font-size: 0.875rem;
  }

  .date-window-dialog-cancel {
    --mdc-theme-primary: var(--primary-text-color);
  }

  .date-window-dialog-submit {
    --mdc-theme-primary: var(--primary-color, #03a9f4);
  }

  .date-window-dialog-delete {
    --mdc-theme-primary: var(--error-color, #db4437);
  }

  @keyframes dp-dialog-shake {
    10%,
    90% {
      transform: translate3d(-2px, 0, 0);
    }
    20%,
    80% {
      transform: translate3d(4px, 0, 0);
    }
    30%,
    50%,
    70% {
      transform: translate3d(-6px, 0, 0);
    }
    40%,
    60% {
      transform: translate3d(6px, 0, 0);
    }
  }

  ha-dialog.dp-shaking {
    animation: dp-dialog-shake 0.5s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
  }

  @media (max-width: 720px) {
    .date-window-dialog-content,
    .date-window-dialog-panel {
      gap: var(--dp-spacing-md);
    }

    .date-window-dialog-preview-row {
      grid-template-columns: 12px minmax(0, 1fr);
    }

    .date-window-dialog-preview-row .value {
      grid-column: 2;
    }

    .date-window-dialog-dates {
      grid-template-columns: 1fr;
    }

    .date-window-dialog-actions {
      flex-wrap: wrap;
    }

    .date-window-dialog-actions-right {
      flex: 1 1 100%;
      justify-content: flex-end;
    }
  }
`;

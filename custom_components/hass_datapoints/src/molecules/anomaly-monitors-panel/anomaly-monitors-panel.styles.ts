import { css } from "lit";

export const styles = css`
  :host {
    --dp-spacing-xs: calc(var(--spacing, 8px) * 0.5);
    --dp-spacing-sm: var(--spacing, 8px);
    --dp-spacing-md: calc(var(--spacing, 8px) * 1.5);
    --dp-spacing-lg: calc(var(--spacing, 8px) * 2);
    display: block;
    height: 100%;
    overflow-y: auto;
  }

  .monitors-panel {
    padding: var(--dp-spacing-sm);
    max-width: 860px;
    margin: 0 auto;
  }

  .monitors-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: var(--dp-spacing-md);
  }

  .monitors-header h2 {
    margin: 0;
    font-size: 1.1em;
    font-weight: 500;
  }

  .monitors-empty {
    text-align: center;
    color: var(--secondary-text-color);
    padding: var(--dp-spacing-lg);
  }

  .monitors-grid {
    display: grid;
    gap: var(--dp-spacing-sm);
  }

  .monitor-card {
    background: var(--card-background-color, var(--secondary-background-color));
    border-radius: 8px;
    padding: var(--dp-spacing-sm) var(--dp-spacing-md);
    box-shadow: var(--ha-card-box-shadow, none);
    display: grid;
    gap: var(--dp-spacing-xs);
    transition: opacity 200ms ease;
    opacity: 1;
  }

  .monitor-card[data-enabled="false"] {
    opacity: 0.65;
  }

  .monitor-card[data-enabled="false"]:hover {
    opacity: 0.85;
  }

  .monitor-card-header {
    display: flex;
    align-items: center;
    gap: var(--dp-spacing-sm);
    flex-wrap: wrap;
  }

  .monitor-name {
    font-weight: 500;
    flex: 1;
  }

  .monitor-anomaly-indicator {
    font-size: 0.78em;
    padding: 2px 8px;
    border-radius: 10px;
    font-weight: 500;
    white-space: nowrap;
    background: var(--error-color, #db4437);
    color: white;
  }

  .monitor-toggle-btn {
    background: none;
    border: none;
    padding: 2px;
    cursor: pointer;
    color: var(--secondary-text-color);
    display: inline-flex;
    align-items: center;
    border-radius: 4px;
    transition: color 120ms ease;
    --mdc-icon-size: 28px;
    appearance: none;
    -webkit-appearance: none;
  }

  .monitor-card[data-enabled="true"] .monitor-toggle-btn {
    color: var(--primary-color, #03a9f4);
  }

  .monitor-toggle-btn:hover {
    color: var(--primary-color, #03a9f4);
  }

  .monitor-entities {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }

  .monitor-overlap-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px;
  }

  .monitor-entity-chip {
    display: inline-flex;
    align-items: center;
    padding: 0;
    margin: 0;
    border: 0;
    background: none;
    font: inherit;
    color: inherit;
    cursor: pointer;
    border-radius: 999px;
  }

  .monitor-entity-chip:focus-visible {
    outline: 2px solid var(--primary-color);
    outline-offset: 2px;
  }

  .overlap-op {
    font-size: 0.72rem;
    font-weight: 700;
    color: var(--secondary-text-color);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    padding: 0 2px;
  }

  .overlap-prefix {
    font-size: 0.72rem;
    font-weight: 700;
    color: var(--secondary-text-color);
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  .monitor-stats {
    display: flex;
    gap: var(--dp-spacing-md);
    align-items: center;
    flex-wrap: wrap;
    color: var(--secondary-text-color);
    font-size: 0.85em;
  }

  .monitor-sparkline-wrap {
    display: flex;
    flex-direction: column;
    flex: 0 0 auto;
    gap: 2px;
  }

  .monitor-sparkline {
    flex: 0 0 auto;
    overflow: visible;
  }

  .sparkline-baseline {
    stroke: var(--divider-color);
    stroke-width: 1;
    stroke-dasharray: 2 2;
  }

  .sparkline-latest {
    fill: var(--primary-color);
  }

  .sparkline-point {
    fill: transparent;
  }

  .sparkline-caption,
  .sparkline-empty {
    font-size: 0.75em;
    color: var(--secondary-text-color);
  }

  .sparkline-empty {
    flex: 0 0 auto;
    min-width: 120px;
    padding: 4px 6px;
    border: 1px dashed var(--divider-color);
    border-radius: 4px;
    text-align: center;
    font-style: italic;
  }

  .monitor-actions {
    display: flex;
    gap: 4px;
    align-items: center;
    flex-wrap: wrap;
    margin-top: var(--dp-spacing-xs);
    border-top: 1px solid var(--divider-color);
    padding-top: var(--dp-spacing-xs);
  }

  .monitor-actions-spacer {
    flex: 1;
  }

  /* ---- Compact icon action buttons (view/edit/device/delete/dismiss) ---- */

  .icon-action {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    padding: 0;
    margin: 0;
    border: 0;
    border-radius: 6px;
    background: none;
    color: var(--secondary-text-color);
    cursor: pointer;
    font: inherit;
    text-decoration: none;
    appearance: none;
    -webkit-appearance: none;
    --mdc-icon-size: 20px;
    transition:
      color 120ms ease,
      background 120ms ease;
  }

  .icon-action:hover {
    color: var(--primary-color, #03a9f4);
    background: color-mix(
      in srgb,
      var(--primary-color, #03a9f4) 12%,
      transparent
    );
  }

  .icon-action:focus-visible {
    outline: 2px solid var(--primary-color);
    outline-offset: 2px;
  }

  a.device-link {
    color: var(--primary-color);
  }

  .delete-btn {
    color: var(--error-color, #db4437);
  }

  .delete-btn:hover {
    color: var(--error-color, #db4437);
    background: color-mix(
      in srgb,
      var(--error-color, #db4437) 12%,
      transparent
    );
  }

  /* ---- Compact text action buttons (dismiss-until picker) ---- */

  .text-action {
    border: 1px solid var(--divider-color);
    border-radius: 6px;
    background: none;
    color: var(--primary-text-color);
    font: inherit;
    font-size: 0.78rem;
    padding: 4px 8px;
    cursor: pointer;
    appearance: none;
    -webkit-appearance: none;
    transition:
      color 120ms ease,
      border-color 120ms ease;
  }

  .text-action:hover,
  .text-action:focus-visible {
    color: var(--primary-color, #03a9f4);
    border-color: var(--primary-color, #03a9f4);
    outline: none;
  }

  /* ---- "New monitor" button ---- */

  .new-monitor-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 16px;
    border: 0;
    border-radius: 6px;
    font: inherit;
    font-size: 0.9rem;
    color: var(--primary-color, #3b82f6);
    background: color-mix(
      in srgb,
      var(--primary-color, #3b82f6) 14%,
      transparent
    );
    cursor: pointer;
    --mdc-icon-size: 18px;
    appearance: none;
    -webkit-appearance: none;
    transition: background 120ms ease;
  }

  .new-monitor-btn:hover,
  .new-monitor-btn:focus-visible {
    background: color-mix(
      in srgb,
      var(--primary-color, #3b82f6) 22%,
      transparent
    );
    outline: none;
  }

  /* ---- Reviewable dismissed detections ---- */

  .dismissed-windows {
    display: grid;
    gap: var(--dp-spacing-xs);
    margin-top: var(--dp-spacing-xs);
  }

  .dismissed-heading {
    font-size: 0.78rem;
    font-weight: 600;
    color: var(--secondary-text-color);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .dismissed-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 4px;
  }

  .dismissed-item {
    display: flex;
    align-items: center;
    gap: var(--dp-spacing-sm);
    flex-wrap: wrap;
    padding: 4px 6px;
    border: 1px solid var(--divider-color);
    border-radius: 6px;
  }

  .dismissed-meta {
    display: flex;
    flex-direction: column;
    gap: 1px;
    flex: 1 1 auto;
    min-width: 0;
    font-size: 0.8em;
    color: var(--secondary-text-color);
  }

  .dismissed-range {
    color: var(--primary-text-color);
  }

  .dismissed-item-actions {
    display: flex;
    gap: 2px;
    flex: 0 0 auto;
  }

  /* ---- Recently deleted (trash) ---- */

  .trash-section {
    margin-top: var(--dp-spacing-lg);
    border-top: 1px solid var(--divider-color);
    padding-top: var(--dp-spacing-sm);
    display: grid;
    gap: var(--dp-spacing-xs);
  }

  .trash-heading {
    margin: 0;
    font-size: 0.82rem;
    font-weight: 600;
    color: var(--secondary-text-color);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .trash-list {
    display: grid;
    gap: 4px;
  }

  .trash-item {
    display: flex;
    align-items: center;
    gap: var(--dp-spacing-sm);
    flex-wrap: wrap;
    padding: 6px 8px;
    border: 1px solid var(--divider-color);
    border-radius: 6px;
    background: var(--card-background-color, var(--secondary-background-color));
  }

  .trash-item-info {
    display: flex;
    flex-direction: column;
    gap: 1px;
    flex: 1 1 auto;
    min-width: 0;
  }

  .trash-name {
    font-weight: 500;
  }

  .trash-deleted-at {
    font-size: 0.8em;
    color: var(--secondary-text-color);
  }

  .trash-item-actions {
    display: flex;
    gap: 2px;
    flex: 0 0 auto;
  }
`;

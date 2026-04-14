import { css } from "lit";

export const styles = css`
  :host {
    --dp-spacing-xs: calc(var(--spacing, 8px) * 0.5);
    --dp-spacing-sm: var(--spacing, 8px);
    --dp-spacing-md: calc(var(--spacing, 8px) * 1.5);
    --dp-spacing-lg: calc(var(--spacing, 8px) * 2);
    display: block;
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

  .monitor-type-badge {
    font-size: 0.8em;
    padding: 2px 6px;
    border-radius: 10px;
    background: var(--divider-color);
    color: var(--secondary-text-color);
    white-space: nowrap;
  }

  .monitor-status-badge {
    font-size: 0.8em;
    padding: 2px 8px;
    border-radius: 10px;
    font-weight: 500;
    white-space: nowrap;
  }

  .monitor-status-badge.anomaly {
    background: var(--error-color, #db4437);
    color: white;
  }

  .monitor-status-badge.normal {
    background: var(--success-color, #43a047);
    color: white;
  }

  .monitor-status-badge.disabled {
    background: var(--divider-color);
    color: var(--secondary-text-color);
  }

  .monitor-entities {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }

  .monitor-entity-chip {
    font-size: 0.8em;
    padding: 1px 6px;
    background: var(--divider-color);
    border-radius: 10px;
    color: var(--secondary-text-color);
  }

  .monitor-stats {
    display: flex;
    gap: var(--dp-spacing-md);
    align-items: center;
    flex-wrap: wrap;
    color: var(--secondary-text-color);
    font-size: 0.85em;
  }

  .monitor-sparkline {
    flex: 0 0 auto;
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

  a.device-link {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 0.85em;
    color: var(--primary-color);
    text-decoration: none;
    padding: 0 4px;
  }

  a.device-link:hover {
    text-decoration: underline;
  }

  a.device-link ha-icon {
    --mdc-icon-size: 16px;
  }

  /* ---- "New monitor" button — matches save-monitor-btn style ---- */

  .new-monitor-btn {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 4px 8px;
    border: 0;
    border-radius: 6px;
    font: inherit;
    font-size: 0.82rem;
    color: var(--primary-color, #3b82f6);
    background: color-mix(
      in srgb,
      var(--primary-color, #3b82f6) 14%,
      transparent
    );
    cursor: pointer;
    --mdc-icon-size: 16px;
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
`;

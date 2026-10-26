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

  .monitors-title {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-width: 0;
    margin-left: var(--dp-spacing-sm);
  }

  .monitors-subtitle {
    font-size: 12px;
    color: var(--secondary-text-color);
  }

  .monitors-range-bar {
    display: none;
    align-items: center;
    gap: var(--dp-spacing-sm);
    margin-bottom: var(--dp-spacing-sm);
    padding: var(--dp-spacing-xs) var(--dp-spacing-sm);
    border-radius: 8px;
    font-size: 12px;
    color: var(--secondary-text-color);
    background: var(--secondary-background-color);
  }

  @media (max-width: 600px) {
    .monitors-range-bar {
      display: flex;
    }
  }

  .monitors-filter {
    margin-bottom: var(--dp-spacing-md);
  }

  .filter-empty-clear {
    font: inherit;
    cursor: pointer;
    color: var(--primary-color);
    background: none;
    border: 1px solid var(--divider-color);
    border-radius: var(--ha-border-radius-pill, 999px);
    padding: var(--dp-spacing-xs) var(--dp-spacing-md);
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
    border-radius: 12px;
    padding: var(--dp-spacing-sm) var(--dp-spacing-md);
    box-shadow: var(--ha-card-box-shadow, none);
    display: grid;
    gap: var(--dp-spacing-sm);
    transition: opacity 200ms ease;
    opacity: 1;
    /* Card-level container so the body + header adapt to the card's own width
       (the panel has no size prop). */
    container-type: inline-size;
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
    gap: 10px;
    flex-wrap: wrap;
  }

  .monitor-name {
    font-weight: 600;
    font-size: 14px;
    color: var(--primary-text-color);
    min-width: 0;
    flex: 0 1 auto;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .monitor-header-spacer {
    flex: 1 1 auto;
  }

  /* ---- Header on/off toggle switch (role="switch") ---- */

  .monitor-switch {
    appearance: none;
    -webkit-appearance: none;
    border: 0;
    background: none;
    padding: 2px;
    margin: 0;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    border-radius: 999px;
  }

  .switch-track {
    display: inline-flex;
    align-items: center;
    width: 36px;
    height: 20px;
    border-radius: 999px;
    background: var(--divider-color);
    transition: background 120ms ease;
  }

  .switch-thumb {
    width: 16px;
    height: 16px;
    margin: 0 2px;
    border-radius: 50%;
    background: var(--card-background-color, #fff);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
    transition: transform 120ms ease;
  }

  .monitor-switch[aria-checked="true"] .switch-track {
    background: var(--primary-color, #03a9f4);
  }

  .monitor-switch[aria-checked="true"] .switch-thumb {
    transform: translateX(16px);
  }

  .monitor-switch:focus-visible {
    outline: 2px solid var(--primary-color);
    outline-offset: 2px;
  }

  .monitor-header-actions {
    display: inline-flex;
    gap: 2px;
    align-items: center;
  }

  /* ---- Mobile "more actions" overflow menu (hidden on wide cards) ---- */

  .monitor-overflow {
    position: relative;
    display: none;
  }

  .overflow-menu {
    position: absolute;
    top: calc(100% + 4px);
    right: 0;
    z-index: 2;
    display: grid;
    gap: 2px;
    padding: 4px;
    min-width: 160px;
    background: var(--card-background-color, var(--secondary-background-color));
    border: 1px solid var(--divider-color);
    border-radius: 8px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
  }

  .overflow-item {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 8px 10px;
    border: 0;
    border-radius: 6px;
    background: none;
    color: var(--primary-text-color);
    font: inherit;
    font-size: 0.85rem;
    text-align: left;
    cursor: pointer;
    --mdc-icon-size: 18px;
    appearance: none;
    -webkit-appearance: none;
  }

  .overflow-item:hover,
  .overflow-item:focus-visible {
    background: color-mix(
      in srgb,
      var(--primary-color, #03a9f4) 12%,
      transparent
    );
    outline: none;
  }

  .overflow-item.delete-btn {
    color: var(--error-color, #db4437);
  }

  /* ---- Card body: entity area beside the stats block ---- */

  .monitor-body {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 260px;
    gap: var(--dp-spacing-md);
    align-items: start;
  }

  .monitor-entity-area {
    min-width: 0;
  }

  /* ---- Stats block ---- */

  .monitor-stats-block {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--dp-spacing-sm) var(--dp-spacing-md);
    background: var(--secondary-background-color);
    border-radius: 8px;
    padding: 12px 14px;
  }

  .monitor-stat {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }

  .stat-label {
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--secondary-text-color);
  }

  .stat-value {
    font-size: 20px;
    font-weight: 600;
    line-height: 1.1;
    color: var(--primary-text-color);
    font-variant-numeric: tabular-nums;
  }

  .stat-caption {
    font-size: 11px;
    color: color-mix(in srgb, var(--secondary-text-color) 70%, transparent);
  }

  /* ---- Footer: trigger logic + device link ---- */

  .monitor-footer {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: var(--dp-spacing-sm);
    border-top: 1px solid var(--divider-color);
    padding-top: 10px;
  }

  .monitor-footer-spacer {
    flex: 1 1 auto;
  }

  .monitor-trigger-logic {
    font-size: 0.85em;
    color: var(--secondary-text-color);
  }

  .monitor-device-link {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 10px;
    border-radius: 6px;
    font-size: 0.85em;
    font-weight: 500;
    color: var(--primary-color);
    text-decoration: none;
    --mdc-icon-size: 18px;
    transition: background 120ms ease;
  }

  .monitor-device-link:hover,
  .monitor-device-link:focus-visible {
    background: color-mix(
      in srgb,
      var(--primary-color, #03a9f4) 12%,
      transparent
    );
    outline: none;
  }

  /* ---- Narrow cards: stack the body (stats first) and collapse actions ---- */

  @container (max-width: 520px) {
    .monitor-body {
      grid-template-columns: 1fr;
    }

    .monitor-stats-block {
      order: -1;
    }

    .monitor-header-actions {
      display: none;
    }

    .monitor-overflow {
      display: inline-flex;
    }
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

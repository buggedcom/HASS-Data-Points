import { css } from "lit";

export const styles = css`
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

  dp-target-row.is-drag-over-before,
  dp-target-row.is-drag-over-after {
    position: relative;
    overflow: visible;
  }

  dp-target-row.is-drag-over-before::before,
  dp-target-row.is-drag-over-after::after {
    content: '';
    position: absolute;
    left: 8px;
    right: 8px;
    height: 2px;
    border-radius: 2px;
    background: var(--primary-color, #03a9f4);
    pointer-events: none;
    z-index: 1;
  }

  dp-target-row.is-drag-over-before::before {
    top: -2px;
  }

  dp-target-row.is-drag-over-after::after {
    bottom: -2px;
  }
`;

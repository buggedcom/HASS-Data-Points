import { css } from "lit";

export const styles = css`
  :host {
    display: block;
    --dp-spacing-xs: calc(var(--spacing, 8px) * 0.5);
    --dp-spacing-sm: var(--spacing, 8px);
    --dp-spacing-md: calc(var(--spacing, 8px) * 1.5);
  }

  .filter {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: var(--dp-spacing-sm);
  }

  .filter-bar {
    display: flex;
    align-items: center;
    gap: var(--dp-spacing-sm);
  }

  .filter-trigger,
  .clear-filter {
    display: inline-flex;
    align-items: center;
    gap: var(--dp-spacing-xs);
    font: inherit;
    cursor: pointer;
    color: var(--primary-text-color);
    background: var(--card-background-color, var(--secondary-background-color));
    border: 1px solid var(--divider-color);
    border-radius: var(--ha-border-radius-pill, 999px);
    padding: var(--dp-spacing-xs) var(--dp-spacing-md);
  }

  .clear-filter {
    border-color: transparent;
    background: none;
    color: var(--primary-color);
  }

  .filter-trigger:focus-visible,
  .clear-filter:focus-visible,
  .search:focus-visible {
    outline: 2px solid var(--primary-color);
    outline-offset: 2px;
  }

  .filter-badge {
    min-width: 18px;
    padding: 0 var(--dp-spacing-xs);
    border-radius: 9px;
    text-align: center;
    font-size: 0.75em;
    line-height: 18px;
    color: var(--text-primary-color, #fff);
    background: var(--primary-color);
  }

  .picker {
    position: absolute;
    top: 100%;
    left: 0;
    z-index: 5;
    width: min(360px, 100%);
    margin-top: var(--dp-spacing-xs);
    padding: var(--dp-spacing-sm);
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    gap: var(--dp-spacing-sm);
    background: var(--card-background-color, var(--secondary-background-color));
    border: 1px solid var(--divider-color);
    border-radius: var(--ha-card-border-radius, 12px);
    box-shadow: var(--ha-card-box-shadow, 0 4px 12px rgba(0, 0, 0, 0.2));
  }

  .search {
    width: 100%;
    box-sizing: border-box;
    font: inherit;
    padding: var(--dp-spacing-xs) var(--dp-spacing-sm);
    color: var(--primary-text-color);
    background: var(--secondary-background-color);
    border: 1px solid var(--divider-color);
    border-radius: var(--dp-spacing-xs);
  }

  .options {
    max-height: 240px;
    overflow-y: auto;
  }

  .option {
    display: grid;
    grid-template-columns: auto 1fr;
    column-gap: var(--dp-spacing-sm);
    align-items: center;
    padding: var(--dp-spacing-xs);
    cursor: pointer;
    color: var(--primary-text-color);
  }

  .option-id {
    grid-column: 2;
    font-size: 0.8em;
    color: var(--secondary-text-color);
  }

  .no-results {
    padding: var(--dp-spacing-sm);
    color: var(--secondary-text-color);
  }

  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: var(--dp-spacing-xs);
  }
`;

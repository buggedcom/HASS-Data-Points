import { css } from "lit";

export const styles = css`
  :host {
    display: block;
    min-width: 0;
    --heatmap-color: var(--primary-color);
  }

  .heatmap {
    position: relative;
    display: grid;
    gap: 8px;
  }

  .heatmap-row {
    display: grid;
    grid-template-columns: minmax(90px, 30%) minmax(0, 1fr) auto;
    align-items: center;
    gap: 10px;
  }

  .heatmap-label {
    padding: 0;
    border: 0;
    background: none;
    font: inherit;
    text-align: left;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  .heatmap-name {
    font-size: 13px;
    font-weight: 500;
    color: var(--primary-text-color);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .heatmap-id {
    font-size: 11px;
    color: var(--secondary-text-color);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .heatmap-count {
    font-size: 13px;
    font-weight: 600;
    min-width: 2ch;
    text-align: right;
    color: var(--primary-text-color);
    font-variant-numeric: tabular-nums;
  }

  .heatmap-track {
    display: flex;
    gap: 2px;
    height: 22px;
  }

  .heatmap-block {
    flex: 1 1 0;
    min-width: 0;
    padding: 0;
    border: 0;
    border-radius: 2px;
    cursor: pointer;
    background: color-mix(
      in srgb,
      var(--heatmap-color) calc(var(--heat, 0) * 100%),
      var(--secondary-background-color)
    );
  }

  .heatmap-block[data-empty="true"] {
    background: var(--secondary-background-color);
    cursor: default;
  }

  .heatmap-block:hover:not([data-empty="true"]),
  .heatmap-block:focus-visible {
    outline: 2px solid var(--primary-text-color);
    outline-offset: 1px;
  }

  .heatmap-flat {
    height: 22px;
    border-radius: 2px;
    background: var(--secondary-background-color);
  }

  .heatmap-axis {
    display: grid;
    grid-template-columns: minmax(90px, 30%) minmax(0, 1fr) 2ch;
    gap: 10px;
  }

  .heatmap-ticks {
    display: flex;
    justify-content: space-between;
    font-size: 11px;
    color: var(--secondary-text-color);
    grid-column: 2;
  }

  .heatmap-tooltip {
    position: absolute;
    z-index: 2;
    transform: translate(-50%, -100%);
    pointer-events: none;
    padding: 6px 8px;
    border-radius: 6px;
    font-size: 12px;
    white-space: nowrap;
    background: var(--card-background-color, var(--primary-background-color));
    color: var(--primary-text-color);
    border: 1px solid var(--divider-color);
    box-shadow: var(--ha-card-box-shadow, 0 2px 8px rgb(0 0 0 / 20%));
  }

  .heatmap-tooltip-range {
    color: var(--secondary-text-color);
  }
`;

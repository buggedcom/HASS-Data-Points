import { css } from "lit";

export const styles = css`
  :host {
    display: block;
    height: 100%;
  }

  .chart-wrap {
    position: relative;
    height: 100%;
    overflow: hidden;
  }

  .chart-viewport {
    position: relative;
    height: 100%;
    overflow: hidden;
  }

  canvas {
    display: block;
  }

  .chart-loading {
    text-align: center;
    padding: 28px 16px 24px;
    color: var(--secondary-text-color);
  }

  .icon-overlay {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }

  .ann-icon {
    position: absolute;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    transform: translate(-50%, -50%);
    pointer-events: auto;
    cursor: pointer;
    box-shadow: 0 0 0 2px var(--card-background-color, #fff);
  }

  .ann-icon ha-icon {
    --mdc-icon-size: 12px;
  }

  .tooltip {
    position: fixed;
    background: var(--card-background-color, #fff);
    border: 1px solid var(--divider-color, #ddd);
    border-radius: 8px;
    padding: 8px 12px;
    font-size: 0.8em;
    line-height: 1.4;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    pointer-events: none;
    display: none;
    max-width: 220px;
    z-index: 10;
    color: var(--primary-text-color);
  }

  .tt-dot {
    display: inline-block;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    margin-right: 4px;
    flex-shrink: 0;
  }

  .tt-time {
    color: var(--secondary-text-color);
    margin-bottom: 3px;
  }

  .tt-value {
    color: var(--secondary-text-color);
    margin-bottom: 4px;
  }

  .tt-message {
    font-weight: 500;
  }

  .tt-annotation {
    color: var(--secondary-text-color);
    margin-top: 4px;
    white-space: pre-wrap;
  }

  .tt-entities {
    color: var(--secondary-text-color);
    margin-top: 6px;
    white-space: pre-wrap;
  }
`;

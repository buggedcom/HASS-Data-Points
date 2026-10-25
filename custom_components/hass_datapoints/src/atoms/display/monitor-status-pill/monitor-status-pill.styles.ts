import { css } from "lit";

export const styles = css`
  :host {
    display: inline-flex;
  }

  .pill {
    /* Each status sets --pill-color; the pill tints itself from it so a single
       token drives both the dot and the subtle background in light and dark. */
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 2px 10px;
    border-radius: 999px;
    font-size: 0.78em;
    font-weight: 500;
    line-height: 1.5;
    white-space: nowrap;
    color: var(--primary-text-color);
    background: color-mix(in srgb, var(--pill-color) 14%, transparent);
  }

  .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
    background: var(--pill-color);
  }

  .status-healthy {
    --pill-color: var(--success-color, #4caf50);
  }
  .status-warning {
    --pill-color: var(--warning-color, #f59e0b);
  }
  .status-triggered {
    --pill-color: var(--error-color, #f44336);
  }
  .status-paused {
    --pill-color: var(--secondary-text-color, #9e9e9e);
  }
`;

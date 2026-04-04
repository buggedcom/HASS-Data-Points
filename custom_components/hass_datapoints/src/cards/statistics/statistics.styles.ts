import { css } from "lit";

export const styles = css`
  :host {
    display: block;
    height: 100%;
  }

  .chart-wrap {
    position: relative;
    width: 100%;
    height: 100%;
  }

  canvas {
    display: block;
  }

  .legend-events {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 0 16px 8px;
    font-size: 0.8rem;
    color: var(--secondary-text-color);
  }
`;

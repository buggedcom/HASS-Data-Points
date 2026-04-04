import { css } from "lit";

export const styles = css`
  :host {
    display: block;
    flex: 1 1 0;
    min-height: 0;
    overflow: hidden;
  }

  .ann-section {
    border-top: 1px solid var(--divider-color, #eee);
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .ann-list {
    flex: 1 1 0;
    min-height: 0;
    overflow-y: auto;
  }

  .ann-empty {
    text-align: center;
    padding: 16px;
    color: var(--secondary-text-color);
    font-size: 0.85em;
  }
`;

import { css } from "lit";

export const styles = css`
  .binary-display-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 4px 0;
  }

  .binary-display-label {
    flex: 1 1 auto;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .binary-display-row inline-select {
    flex: 0 0 auto;
  }
`;

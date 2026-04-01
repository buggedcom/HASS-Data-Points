import { css } from "lit";

export const styles = css`
  .method-list {
    display: grid;
    gap: var(--dp-spacing-sm, 8px);
  }

  .method-item {
    display: grid;
    gap: var(--dp-spacing-sm, 8px);
  }

  .method-help {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 10px;
    height: 10px;
    flex: 0 0 auto;
    border-radius: 50%;
    border: 1px solid var(--secondary-text-color, #888);
    background: transparent;
    color: var(--secondary-text-color, #888);
    font-size: 9px;
    font-weight: 700;
    line-height: 1;
    cursor: default;
    padding: 0;
    vertical-align: middle;
  }
`;

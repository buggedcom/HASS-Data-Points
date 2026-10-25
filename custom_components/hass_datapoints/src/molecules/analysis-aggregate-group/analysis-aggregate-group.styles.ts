import { css } from "lit";

export const styles = css`
  .method-list {
    display: grid;
    gap: calc(var(--dp-spacing-sm, 8px) * 0.75);
  }

  .method-item {
    display: grid;
    gap: 6px;
  }
`;

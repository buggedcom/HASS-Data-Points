import { css } from "lit";

export const styles = css`
  .analysis-computing-indicator {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    margin-left: 4px;
    vertical-align: middle;
  }

  .analysis-computing-spinner {
    display: inline-block;
    width: 10px;
    height: 10px;
    border: 2px solid var(--divider-color, #ccc);
    border-top-color: var(--primary-color, #03a9f4);
    border-radius: 50%;
    animation: analysis-spin 0.7s linear infinite;
    flex-shrink: 0;
  }

  .analysis-computing-progress {
    font-size: 0.72rem;
    font-weight: 500;
    color: var(--primary-color, #03a9f4);
    line-height: 1;
    min-width: 2.8ch;
  }

  @keyframes analysis-spin {
    to { transform: rotate(360deg); }
  }

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

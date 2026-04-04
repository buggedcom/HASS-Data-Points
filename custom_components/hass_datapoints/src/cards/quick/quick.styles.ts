import { css } from "lit";

export const styles = css`
  :host {
    display: block;
    height: 100%;
  }
  ha-card {
    height: 100%;
    padding: 12px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    overflow: hidden;
    box-sizing: border-box;
    position: relative;
    gap: 8px;
  }
  feedback-banner {
    position: absolute;
    left: 12px;
    right: 12px;
    bottom: 2px;
    --dp-feedback-margin-top: 0;
    --dp-feedback-padding: 2px 8px;
    --dp-feedback-radius: 4px;
  }
  .card-header {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 1.1em;
    font-weight: 500;
    color: var(--primary-text-color);
  }
  .input-row {
    display: flex;
    gap: 8px;
    align-items: center;
  }
  .input-row ha-textfield {
    flex: 1;
  }
`;

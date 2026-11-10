import { css } from "lit";

export const styles = css`
  :host {
    --dp-spacing-xs: 4px;
    --dp-spacing-sm: 8px;
    --dp-spacing-md: 12px;
  }

  ha-dialog {
    --mdc-dialog-min-width: min(960px, calc(100vw - 32px));
    --mdc-dialog-max-width: min(960px, calc(100vw - 32px));
    --ha-dialog-width-md: min(960px, calc(100vw - 32px));
  }

  .series-preview-content {
    display: grid;
    gap: var(--dp-spacing-md);
    /* ha-dialog sets a large "--spacing" for its own padding; the chart card
     * sizes its chrome from it, so pin it back to the page's 8px. */
    --spacing: 8px;
    min-width: min(900px, calc(100vw - 64px));
  }

  .series-preview-chart {
    display: block;
    min-height: 320px;
    height: min(60vh, 480px);
  }

  .series-preview-chart > * {
    display: block;
    height: 100%;
  }

  .series-preview-subheading {
    margin: 0;
    font-size: 0.82rem;
    color: var(--secondary-text-color);
  }

  .series-preview-actions {
    display: flex;
    justify-content: flex-end;
    gap: var(--dp-spacing-sm);
  }

  @media (max-width: 600px) {
    .series-preview-content {
      min-width: 0;
    }

    .series-preview-chart {
      height: 50vh;
    }
  }
`;

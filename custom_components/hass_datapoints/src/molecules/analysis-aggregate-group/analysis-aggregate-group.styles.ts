import { css } from "lit";

export const styles = css`
  .heading {
    font-size: 0.84rem;
    font-weight: 600;
    color: var(--primary-text-color);
    margin-bottom: var(--dp-spacing-xs);
  }

  .list {
    display: grid;
    gap: var(--dp-spacing-sm);
  }

  .definition {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--dp-spacing-sm);
    padding: var(--dp-spacing-sm);
    border-radius: 10px;
    border: 1px solid
      color-mix(
        in srgb,
        var(--divider-color, rgba(0, 0, 0, 0.12)) 88%,
        transparent
      );
  }

  .button {
    display: inline-flex;
    align-items: center;
    gap: var(--dp-spacing-xs);
    padding: var(--dp-spacing-xs) var(--dp-spacing-sm);
    border-radius: 8px;
    border: 1px solid var(--divider-color, rgba(0, 0, 0, 0.12));
    background: transparent;
    color: var(--primary-text-color);
    font: inherit;
    font-size: 0.8rem;
    cursor: pointer;
  }

  .button:focus-visible {
    outline: 2px solid var(--primary-color, #03a9f4);
    outline-offset: 2px;
  }

  .remove {
    margin-left: auto;
  }

  .add {
    margin-top: var(--dp-spacing-sm);
  }
`;

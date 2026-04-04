import { loadHaComponents } from "@kipk/load-ha-components";
import { esc } from "@/lib/util/format.js";

const HA_COMPONENT_LOAD_TIMEOUT_MS = 6000;
const HA_COMPONENT_LOADER_SUPPORTED_TAGS = new Set([
  "ha-form",
  "ha-icon",
  "ha-icon-button",
  "ha-selector",
  "ha-textfield",
  "ha-icon-picker",
  "ha-entity-picker",
  "ha-select",
  "ha-dialog",
  "ha-sortable",
  "ha-svg-icon",
  "ha-alert",
  "ha-button",
  "ha-color-picker",
  "ha-badge",
  "ha-sankey-chart",
  "mwc-button",
]);
const HA_HISTORY_ROUTE_COMPONENT_TAGS = new Set([
  "ha-target-picker",
  "ha-date-range-picker",
]);

async function preloadHistoryRouteComponents(tags = []) {
  const historyTags = tags.filter(
    (tag) =>
      HA_HISTORY_ROUTE_COMPONENT_TAGS.has(tag) && !customElements.get(tag)
  );
  if (!historyTags.length) {
    return;
  }
  try {
    const app = document.querySelector("home-assistant");
    const panels = app?.hass?.panels;
    if (!panels?.history) {
      logger.warn(
        "[hass-datapoints ha] history panel not available for preload"
      );
      return;
    }
    const resolver = document.createElement("partial-panel-resolver");
    if (typeof resolver._updateRoutes !== "function") {
      logger.warn(
        "[hass-datapoints ha] partial-panel-resolver missing _updateRoutes"
      );
      return;
    }
    resolver.hass = { panels };
    resolver._updateRoutes();
    const load = resolver.routerOptions?.routes?.history?.load;
    if (typeof load !== "function") {
      logger.warn("[hass-datapoints ha] history route loader missing");
      return;
    }
    await load();
  } catch (error) {
    logger.warn("[hass-datapoints ha] history route preload failed", {
      historyTags,
      message: error?.message || String(error),
    });
  }
}

export function waitForHaComponent(
  tag,
  timeoutMs = HA_COMPONENT_LOAD_TIMEOUT_MS
) {
  if (!tag) return Promise.resolve(false);
  if (customElements.get(tag)) {
    return Promise.resolve(true);
  }
  return Promise.race([
    customElements.whenDefined(tag).then(() => true),
    new Promise((resolve) => {
      window.setTimeout(() => {
        logger.warn("[hass-datapoints ha] component wait timed out", {
          tag,
          timeoutMs,
        });
        resolve(false);
      }, timeoutMs);
    }),
  ]);
}

export function ensureHaComponents(tags = []) {
  const componentTags = [...new Set((tags || []).filter(Boolean))];
  const loaderTags = componentTags.filter((tag) =>
    HA_COMPONENT_LOADER_SUPPORTED_TAGS.has(tag)
  );
  const loadPromise = Promise.resolve()
    .then(() =>
      typeof loadHaComponents === "function" && loaderTags.length
        ? Promise.resolve(loadHaComponents(loaderTags)).catch((error) => {
            logger.warn("[hass-datapoints ha] loader failed", {
              loaderTags,
              message: error?.message || String(error),
            });
            return undefined;
          })
        : undefined
    )
    .then(() => preloadHistoryRouteComponents(componentTags));
  return loadPromise
    .then(() =>
      Promise.all(componentTags.map((tag) => waitForHaComponent(tag)))
    )
    .then((results) => {
      const summary = componentTags.map((tag, index) => ({
        tag,
        ready: !!results[index],
        defined: !!customElements.get(tag),
      }));
      return summary;
    });
}

export function confirmDestructiveAction(host, options = {}) {
  return ensureHaComponents(["ha-dialog"]).then(
    () =>
      new Promise((resolve) => {
        const root = host?.shadowRoot || host;
        if (!root || !root.appendChild) {
          // this is a fallback if something goes wrong with the custom element loader
          // eslint-disable-next-line no-alert
          const confirmation = window.confirm(
            options.message || options.title || "Are you sure?"
          );
          resolve(confirmation);
          return;
        }

        const dialog = document.createElement("ha-dialog");
        dialog.setAttribute("hideActions", "");
        dialog.scrimClickAction = true;
        dialog.escapeKeyAction = true;
        dialog.open = false;
        dialog.headerTitle = options.title || "Confirm delete";
        if (host?._hass) dialog.hass = host._hass;
        dialog.innerHTML = `
        <style>
          .confirm-dialog-body {
            padding: 0 var(--dp-spacing-lg, 24px) var(--dp-spacing-lg, 24px);
            color: var(--primary-text-color);
          }
          .confirm-dialog-message {
            line-height: 1.5;
            color: var(--secondary-text-color, var(--primary-text-color));
          }
          .confirm-dialog-actions {
            display: flex;
            justify-content: flex-end;
            gap: var(--dp-spacing-sm, 8px);
            margin-top: var(--dp-spacing-lg, 24px);
          }
          .confirm-dialog-button {
            border: 0;
            border-radius: 999px;
            padding: 0 16px;
            height: 36px;
            font: inherit;
            cursor: pointer;
          }
          .confirm-dialog-button.cancel {
            background: transparent;
            color: var(--primary-text-color);
          }
          .confirm-dialog-button.confirm {
            background: var(--error-color, #db4437);
            color: white;
          }
        </style>
        <div class="confirm-dialog-body">
          <div class="confirm-dialog-message">${esc(options.message || "Are you sure you want to delete this item?")}</div>
          <div class="confirm-dialog-actions">
            <button type="button" class="confirm-dialog-button cancel">${esc(options.cancelLabel || "Cancel")}</button>
            <button type="button" class="confirm-dialog-button confirm">${esc(options.confirmLabel || "Delete")}</button>
          </div>
        </div>
      `;

        let settled = false;
        const finish = (value) => {
          if (settled) return;
          settled = true;
          dialog.open = false;
          resolve(value);
        };

        const cancelButton = dialog.querySelector(
          ".confirm-dialog-button.cancel"
        );
        const confirmButton = dialog.querySelector(
          ".confirm-dialog-button.confirm"
        );

        cancelButton?.addEventListener("click", () => finish(false));
        confirmButton?.addEventListener("click", () => finish(true));
        dialog.addEventListener("keydown", (event) => {
          if (
            event.key !== "Enter" ||
            event.shiftKey ||
            event.altKey ||
            event.ctrlKey ||
            event.metaKey
          ) {
            return;
          }
          event.preventDefault();
          finish(true);
        });
        dialog.addEventListener(
          "closed",
          () => {
            dialog.remove();
            if (!settled) resolve(false);
          },
          { once: true }
        );

        root.appendChild(dialog);
        dialog.open = true;
        window.requestAnimationFrame(() => {
          confirmButton?.focus();
        });
      })
  );
}

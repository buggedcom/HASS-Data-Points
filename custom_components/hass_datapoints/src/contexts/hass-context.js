import { createContext } from "@lit/context";

/**
 * Context key for providing the Home Assistant `hass` object
 * down the component tree without prop drilling.
 *
 * Usage in providers (cards, panels):
 *   import { provide } from "@lit/context";
 *   import { hassContext } from "../contexts/hass-context.js";
 *
 *   @provide({ context: hassContext })
 *   hass = null;
 *
 * Usage in consumers (atoms that need hass):
 *   import { consume } from "@lit/context";
 *   import { hassContext } from "../contexts/hass-context.js";
 *
 *   @consume({ context: hassContext, subscribe: true })
 *   hass = null;
 */
export const hassContext = createContext("hass");

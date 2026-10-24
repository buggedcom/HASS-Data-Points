import { css } from "lit";

/**
 * Single source of truth for the width of the entity/area/device **target
 * picker** (`ha-target-picker`).
 *
 * The same width is used in two very different contexts, so it has to be
 * expressed in two forms that must never drift apart:
 *
 * - The **anomaly monitor wizard** sizes its dialog in CSS → {@link targetPickerWidthCss}.
 * - The **sidebar** floats the picker as a fixed-position popover whose width is
 *   computed in JS (see `orchestration-context`) → {@link resolveTargetPickerWidthPx}.
 *
 * Keeping both derived from the same two constants is what lets the sidebar
 * picker present "as wide as in the anomaly monitor dialog" (issue #89).
 */

/** Fixed pixel cap for the target picker width. */
export const TARGET_PICKER_WIDTH_PX = 480;

/** Viewport-relative fallback (as a vw percentage) for narrow screens. */
export const TARGET_PICKER_WIDTH_VW = 90;

/** CSS width expression: `min(480px, 90vw)`. */
export const targetPickerWidthCss = css`min(${TARGET_PICKER_WIDTH_PX}px, ${TARGET_PICKER_WIDTH_VW}vw)`;

/**
 * Resolves the CSS `min(480px, 90vw)` expression to a concrete pixel width for
 * imperative (JS) layout, given a viewport width.
 */
export function resolveTargetPickerWidthPx(
  viewportWidth: number = window.innerWidth
): number {
  const viewportRelative = Math.round(
    (viewportWidth * TARGET_PICKER_WIDTH_VW) / 100
  );
  return Math.min(TARGET_PICKER_WIDTH_PX, viewportRelative);
}

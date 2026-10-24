import { describe, expect, it } from "vitest";

import {
  resolveTargetPickerWidthPx,
  TARGET_PICKER_WIDTH_PX,
  TARGET_PICKER_WIDTH_VW,
} from "../target-picker-width";

describe("target-picker-width", () => {
  describe("GIVEN a viewport wider than the pixel cap", () => {
    describe("WHEN resolving the target picker width", () => {
      it("THEN it caps at the fixed pixel width", () => {
        expect.assertions(1);
        // 90vw of 2000px is 1800px, so the 480px cap wins.
        expect(resolveTargetPickerWidthPx(2000)).toBe(TARGET_PICKER_WIDTH_PX);
      });
    });
  });

  describe("GIVEN a viewport narrower than the pixel cap", () => {
    describe("WHEN resolving the target picker width", () => {
      it("THEN it falls back to the viewport-relative width", () => {
        expect.assertions(1);
        // 90vw of 400px is 360px, below the 480px cap.
        expect(resolveTargetPickerWidthPx(400)).toBe(
          Math.round((400 * TARGET_PICKER_WIDTH_VW) / 100)
        );
      });
    });
  });
});

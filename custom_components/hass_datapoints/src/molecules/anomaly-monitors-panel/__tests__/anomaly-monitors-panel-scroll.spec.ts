import { afterEach, describe, expect, it } from "vitest";
import { styles } from "../anomaly-monitors-panel.styles";

afterEach(() => {
  document.body.replaceChildren();
});

describe("GIVEN an anomalies listing inside a constrained content area", () => {
  describe("WHEN the listing's host styles are applied", () => {
    it("THEN fills the available height and allows vertical scrolling", () => {
      expect.assertions(2);
      const host = document.createElement("div");
      host.id = "listing";
      const sheet = document.createElement("style");
      sheet.textContent = styles.cssText.replace(":host", "#listing");
      document.body.append(sheet, host);

      const computed = getComputedStyle(host);
      expect(computed.height).toBe("100%");
      expect(computed.overflowY).toBe("auto");
    });
  });
});

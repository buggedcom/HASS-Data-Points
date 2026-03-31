import { afterEach, beforeEach, describe, expect, it } from "vitest";
import "../dp-sidebar-section-header";

function createElement(title = "", subtitle = "") {
  const el = document.createElement("dp-sidebar-section-header") as HTMLElement & {
    title: string;
    subtitle: string;
  };
  el.title = title;
  el.subtitle = subtitle;
  document.body.appendChild(el);
  return el;
}

function cleanup(el: HTMLElement) {
  el.remove();
}

describe("dp-sidebar-section-header", () => {
  let el: HTMLElement & { title: string; subtitle: string };

  afterEach(() => {
    if (el) cleanup(el);
  });

  describe("GIVEN a header with title and subtitle", () => {
    beforeEach(async () => {
      el = createElement("Target Analysis", "3 entities tracked");
      await el.updateComplete;
    });

    describe("WHEN rendered", () => {
      it("THEN it displays the title", () => {
        expect.assertions(1);
        const title = el.shadowRoot!.querySelector(".sidebar-section-title");
        expect(title?.textContent?.trim()).toBe("Target Analysis");
      });

      it("THEN it displays the subtitle", () => {
        expect.assertions(1);
        const subtitle = el.shadowRoot!.querySelector(".sidebar-section-subtitle");
        expect(subtitle?.textContent?.trim()).toBe("3 entities tracked");
      });
    });
  });

  describe("GIVEN a header with title only", () => {
    beforeEach(async () => {
      el = createElement("Filters");
      await el.updateComplete;
    });

    describe("WHEN rendered", () => {
      it("THEN it displays the title", () => {
        expect.assertions(1);
        const title = el.shadowRoot!.querySelector(".sidebar-section-title");
        expect(title?.textContent?.trim()).toBe("Filters");
      });

      it("THEN it does not render a subtitle element", () => {
        expect.assertions(1);
        const subtitle = el.shadowRoot!.querySelector(".sidebar-section-subtitle");
        expect(subtitle).toBeNull();
      });
    });
  });

  describe("GIVEN a header that updates subtitle", () => {
    beforeEach(async () => {
      el = createElement("Targets", "2 items");
      await el.updateComplete;
    });

    describe("WHEN the subtitle changes", () => {
      it("THEN it displays the updated subtitle", async () => {
        expect.assertions(1);
        el.subtitle = "5 items";
        await el.updateComplete;
        const subtitle = el.shadowRoot!.querySelector(".sidebar-section-subtitle");
        expect(subtitle?.textContent?.trim()).toBe("5 items");
      });
    });
  });

  describe("GIVEN a header that removes subtitle", () => {
    beforeEach(async () => {
      el = createElement("Section", "Was here");
      await el.updateComplete;
    });

    describe("WHEN the subtitle is cleared", () => {
      it("THEN the subtitle element is removed", async () => {
        expect.assertions(1);
        el.subtitle = "";
        await el.updateComplete;
        const subtitle = el.shadowRoot!.querySelector(".sidebar-section-subtitle");
        expect(subtitle).toBeNull();
      });
    });
  });
});

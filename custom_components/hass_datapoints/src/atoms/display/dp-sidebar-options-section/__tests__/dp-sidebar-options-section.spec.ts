import { afterEach, beforeEach, describe, expect, it } from "vitest";
import "../dp-sidebar-options-section";

function createElement(props: Record<string, unknown> = {}) {
  const el = document.createElement("dp-sidebar-options-section") as HTMLElement & {
    title: string;
    subtitle: string;
    updateComplete: Promise<boolean>;
  };
  Object.assign(el, { title: "", subtitle: "", ...props });
  document.body.appendChild(el);
  return el;
}

describe("dp-sidebar-options-section", () => {
  let el: ReturnType<typeof createElement>;

  afterEach(() => el?.remove());

  describe("GIVEN a section with title and subtitle", () => {
    beforeEach(async () => {
      el = createElement({ title: "Chart Display", subtitle: "Configure the chart." });
      await el.updateComplete;
    });

    describe("WHEN rendered", () => {
      it("THEN renders a dp-sidebar-section-header element", () => {
        expect.assertions(1);
        const header = el.shadowRoot!.querySelector("dp-sidebar-section-header");
        expect(header).not.toBeNull();
      });

      it("THEN passes title to the header", () => {
        expect.assertions(1);
        const header = el.shadowRoot!.querySelector("dp-sidebar-section-header") as HTMLElement & { title: string };
        expect(header.title).toBe("Chart Display");
      });

      it("THEN passes subtitle to the header", () => {
        expect.assertions(1);
        const header = el.shadowRoot!.querySelector("dp-sidebar-section-header") as HTMLElement & { subtitle: string };
        expect(header.subtitle).toBe("Configure the chart.");
      });

      it("THEN renders a slot element for body content", () => {
        expect.assertions(1);
        const slot = el.shadowRoot!.querySelector("slot");
        expect(slot).not.toBeNull();
      });
    });
  });

  describe("GIVEN a section with only a title", () => {
    beforeEach(async () => {
      el = createElement({ title: "Datapoints" });
      await el.updateComplete;
    });

    describe("WHEN rendered", () => {
      it("THEN the header subtitle is an empty string", () => {
        expect.assertions(1);
        const header = el.shadowRoot!.querySelector("dp-sidebar-section-header") as HTMLElement & { subtitle: string };
        expect(header.subtitle).toBe("");
      });
    });
  });
});

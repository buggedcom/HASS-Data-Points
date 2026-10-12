import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import "../date-window-dialog";

function createElement(props: RecordWithUnknownValues = {}) {
  const el = document.createElement("date-window-dialog") as HTMLElement & {
    open: boolean;
    heading: string;
    name: string;
    startValue: string;
    endValue: string;
    showDelete: boolean;
    showShortcuts: boolean;
    submitLabel: string;
    updateComplete: Promise<boolean>;
  };
  Object.assign(el, {
    open: true,
    heading: "Add date window",
    name: "",
    startValue: "",
    endValue: "",
    showDelete: false,
    showShortcuts: false,
    submitLabel: "Create date window",
    ...props,
  });
  document.body.appendChild(el);
  return el;
}

// A valid, named range used by the happy-path submit tests. Because the dialog
// now self-validates, submit only fires when a non-empty name and a start
// strictly before the end are present.
const VALID_RANGE = {
  startValue: "2025-01-01T00:00",
  endValue: "2025-01-07T00:00",
};

function nameInput(el: HTMLElement): HTMLInputElement {
  return el.shadowRoot!.querySelector("#date-window-name") as HTMLInputElement;
}

function submitButton(el: HTMLElement): HTMLElement {
  return el.shadowRoot!.querySelector(
    ".date-window-dialog-submit"
  ) as HTMLElement;
}

function errorRegion(el: HTMLElement): Nullable<HTMLElement> {
  return el.shadowRoot!.querySelector(".date-window-dialog-error");
}

/** Simulate a user typing into the name field. */
function typeName(el: HTMLElement, value: string) {
  const input = nameInput(el);
  (input as HTMLInputElement & { value: string }).value = value;
  input.dispatchEvent(new Event("input", { bubbles: true, composed: true }));
}

describe("date-window-dialog", () => {
  let el: ReturnType<typeof createElement>;

  afterEach(() => el?.remove());

  // ---------------------------------------------------------------------------
  // Structure
  // ---------------------------------------------------------------------------

  describe("GIVEN default props with open=true", () => {
    beforeEach(async () => {
      el = createElement();
      await el.updateComplete;
    });

    describe("WHEN rendered", () => {
      it("THEN renders the name field", () => {
        expect.assertions(1);
        expect(
          el.shadowRoot!.querySelector("#date-window-name")
        ).not.toBeNull();
      });

      it("THEN renders the start datetime input", () => {
        expect.assertions(1);
        expect(
          el.shadowRoot!.querySelector("#date-window-start")
        ).not.toBeNull();
      });

      it("THEN renders the end datetime input", () => {
        expect.assertions(1);
        expect(el.shadowRoot!.querySelector("#date-window-end")).not.toBeNull();
      });

      it("THEN renders the cancel button", () => {
        expect.assertions(1);
        expect(
          el.shadowRoot!.querySelector(".date-window-dialog-cancel")
        ).not.toBeNull();
      });

      it("THEN renders the submit button with the submitLabel", () => {
        expect.assertions(1);
        const submit = el.shadowRoot!.querySelector(
          ".date-window-dialog-submit"
        );
        expect(submit?.textContent?.trim()).toBe("Create date window");
      });

      it("THEN does not render the delete button by default", () => {
        expect.assertions(1);
        expect(
          el.shadowRoot!.querySelector(".date-window-dialog-delete")
        ).toBeNull();
      });

      it("THEN does not render shortcut buttons by default", () => {
        expect.assertions(1);
        expect(
          el.shadowRoot!.querySelector(".date-window-dialog-shortcuts")
        ).toBeNull();
      });

      it("THEN does not show an inline error", () => {
        expect.assertions(1);
        expect(errorRegion(el)).toBeNull();
      });
    });
  });

  // ---------------------------------------------------------------------------
  // showDelete
  // ---------------------------------------------------------------------------

  describe("GIVEN showDelete=true", () => {
    beforeEach(async () => {
      el = createElement({ showDelete: true });
      await el.updateComplete;
    });

    describe("WHEN rendered", () => {
      it("THEN renders the delete button", () => {
        expect.assertions(1);
        expect(
          el.shadowRoot!.querySelector(".date-window-dialog-delete")
        ).not.toBeNull();
      });
    });
  });

  // ---------------------------------------------------------------------------
  // showShortcuts
  // ---------------------------------------------------------------------------

  describe("GIVEN showShortcuts=true", () => {
    beforeEach(async () => {
      el = createElement({ showShortcuts: true });
      await el.updateComplete;
    });

    describe("WHEN rendered", () => {
      it("THEN renders the shortcuts container", () => {
        expect.assertions(1);
        expect(
          el.shadowRoot!.querySelector(".date-window-dialog-shortcuts")
        ).not.toBeNull();
      });
    });
  });

  // ---------------------------------------------------------------------------
  // Prop binding
  // ---------------------------------------------------------------------------

  describe("GIVEN name='Heating season' and submitLabel='Save date window'", () => {
    beforeEach(async () => {
      el = createElement({
        name: "Heating season",
        submitLabel: "Save date window",
      });
      await el.updateComplete;
    });

    describe("WHEN rendered", () => {
      it("THEN the submit button shows the custom submitLabel", () => {
        expect.assertions(1);
        const submit = el.shadowRoot!.querySelector(
          ".date-window-dialog-submit"
        );
        expect(submit?.textContent?.trim()).toBe("Save date window");
      });

      it("THEN the name field is seeded from the name prop", () => {
        expect.assertions(1);
        expect(nameInput(el).value).toBe("Heating season");
      });
    });
  });

  // ---------------------------------------------------------------------------
  // Events — cancel / delete / shortcuts (unchanged contract)
  // ---------------------------------------------------------------------------

  describe("GIVEN the component is open and rendered", () => {
    beforeEach(async () => {
      el = createElement();
      await el.updateComplete;
    });

    describe("WHEN the cancel button is clicked", () => {
      it("THEN fires dp-window-close", () => {
        expect.assertions(1);
        const handler = vi.fn();
        el.addEventListener("dp-window-close", handler);
        el.shadowRoot!.querySelector<HTMLElement>(
          ".date-window-dialog-cancel"
        )!.click();
        expect(handler).toHaveBeenCalledOnce();
      });
    });
  });

  describe("GIVEN showDelete=true and rendered", () => {
    beforeEach(async () => {
      el = createElement({ showDelete: true });
      await el.updateComplete;
    });

    describe("WHEN the delete button is clicked", () => {
      it("THEN fires dp-window-delete", () => {
        expect.assertions(1);
        const handler = vi.fn();
        el.addEventListener("dp-window-delete", handler);
        el.shadowRoot!.querySelector<HTMLElement>(
          ".date-window-dialog-delete"
        )!.click();
        expect(handler).toHaveBeenCalledOnce();
      });
    });

    describe("WHEN the delete button is clicked with an empty name", () => {
      it("THEN still fires dp-window-delete, unaffected by validation", () => {
        expect.assertions(1);
        const handler = vi.fn();
        el.addEventListener("dp-window-delete", handler);
        el.shadowRoot!.querySelector<HTMLElement>(
          ".date-window-dialog-delete"
        )!.click();
        expect(handler).toHaveBeenCalledOnce();
      });
    });
  });

  describe("GIVEN showShortcuts=true and rendered", () => {
    beforeEach(async () => {
      el = createElement({ showShortcuts: true });
      await el.updateComplete;
    });

    describe("WHEN the previous range shortcut is clicked", () => {
      it("THEN fires dp-window-shortcut with direction=-1", () => {
        expect.assertions(2);
        const handler = vi.fn();
        el.addEventListener("dp-window-shortcut", handler);
        const shortcuts = el.shadowRoot!.querySelector(
          ".date-window-dialog-shortcuts"
        );
        (shortcuts?.querySelectorAll("ha-button")[0] as HTMLElement)?.click();
        expect(handler).toHaveBeenCalledOnce();
        expect(handler.mock.calls[0][0].detail.direction).toBe(-1);
      });
    });

    describe("WHEN the next range shortcut is clicked", () => {
      it("THEN fires dp-window-shortcut with direction=1", () => {
        expect.assertions(2);
        const handler = vi.fn();
        el.addEventListener("dp-window-shortcut", handler);
        const shortcuts = el.shadowRoot!.querySelector(
          ".date-window-dialog-shortcuts"
        );
        (shortcuts?.querySelectorAll("ha-button")[1] as HTMLElement)?.click();
        expect(handler).toHaveBeenCalledOnce();
        expect(handler.mock.calls[0][0].detail.direction).toBe(1);
      });
    });
  });

  // ---------------------------------------------------------------------------
  // Valid submit (happy path)
  // ---------------------------------------------------------------------------

  describe("GIVEN a typed name and a valid range", () => {
    beforeEach(async () => {
      el = createElement({ ...VALID_RANGE });
      await el.updateComplete;
      typeName(el, "My window");
      await el.updateComplete;
    });

    describe("WHEN the submit button is clicked", () => {
      it("THEN fires dp-window-submit once", () => {
        expect.assertions(1);
        const handler = vi.fn();
        el.addEventListener("dp-window-submit", handler);
        submitButton(el).click();
        expect(handler).toHaveBeenCalledOnce();
      });

      it("THEN dp-window-submit detail carries the trimmed name, start and end", () => {
        expect.assertions(3);
        const handler = vi.fn();
        el.addEventListener("dp-window-submit", handler);
        submitButton(el).click();
        const detail = handler.mock.calls[0][0].detail as {
          name: string;
          start: string;
          end: string;
        };
        expect(detail.name).toBe("My window");
        expect(detail.start).toBe(VALID_RANGE.startValue);
        expect(detail.end).toBe(VALID_RANGE.endValue);
      });

      it("THEN does not show an inline error", async () => {
        expect.assertions(1);
        submitButton(el).click();
        await el.updateComplete;
        expect(errorRegion(el)).toBeNull();
      });
    });
  });

  // ---------------------------------------------------------------------------
  // Name persistence across parent re-renders
  // ---------------------------------------------------------------------------

  describe("GIVEN a typed name and a later parent re-render with a stale name prop", () => {
    beforeEach(async () => {
      el = createElement({ ...VALID_RANGE });
      await el.updateComplete;
      typeName(el, "Heating season");
      await el.updateComplete;
      // Simulate the panel re-rendering in response to a date change: it pushes
      // fresh start/end values AND re-applies the original (stale) name prop.
      el.startValue = "2025-02-01T00:00";
      el.endValue = "2025-02-07T00:00";
      el.name = "";
      await el.updateComplete;
    });

    describe("WHEN the submit button is clicked", () => {
      it("THEN the typed name is still present on dp-window-submit", () => {
        expect.assertions(1);
        const handler = vi.fn();
        el.addEventListener("dp-window-submit", handler);
        submitButton(el).click();
        expect(handler.mock.calls[0][0].detail.name).toBe("Heating season");
      });
    });

    describe("WHEN a date input change fires and the name prop stays stale", () => {
      it("THEN the typed name remains in the name field", async () => {
        expect.assertions(1);
        const startEl = el.shadowRoot!.querySelector(
          "#date-window-start"
        ) as HTMLInputElement;
        startEl.value = "2025-02-02T00:00";
        startEl.dispatchEvent(
          new Event("change", { bubbles: true, composed: true })
        );
        el.name = "";
        await el.updateComplete;
        expect(nameInput(el).value).toBe("Heating season");
      });
    });
  });

  // ---------------------------------------------------------------------------
  // Invalid submit — empty name
  // ---------------------------------------------------------------------------

  describe("GIVEN a valid range but an empty name", () => {
    beforeEach(async () => {
      el = createElement({ ...VALID_RANGE });
      await el.updateComplete;
    });

    describe("WHEN the submit button is clicked", () => {
      it("THEN does not fire dp-window-submit", () => {
        expect.assertions(1);
        const handler = vi.fn();
        el.addEventListener("dp-window-submit", handler);
        submitButton(el).click();
        expect(handler).not.toHaveBeenCalled();
      });

      it("THEN shows an inline error", async () => {
        expect.assertions(1);
        submitButton(el).click();
        await el.updateComplete;
        expect(errorRegion(el)).not.toBeNull();
      });

      it("THEN applies the shake animation class to the dialog", async () => {
        expect.assertions(1);
        submitButton(el).click();
        await el.updateComplete;
        expect(
          el.shadowRoot!.querySelector("ha-dialog.dp-shaking")
        ).not.toBeNull();
      });

      it("THEN clears the error once a name is typed", async () => {
        expect.assertions(2);
        submitButton(el).click();
        await el.updateComplete;
        expect(errorRegion(el)).not.toBeNull();
        typeName(el, "Now named");
        await el.updateComplete;
        expect(errorRegion(el)).toBeNull();
      });
    });
  });

  // ---------------------------------------------------------------------------
  // Invalid submit — bad range (start >= end)
  // ---------------------------------------------------------------------------

  describe("GIVEN a name but a start on or after the end", () => {
    beforeEach(async () => {
      el = createElement({
        startValue: "2025-01-07T00:00",
        endValue: "2025-01-01T00:00",
      });
      await el.updateComplete;
      typeName(el, "Backwards");
      await el.updateComplete;
    });

    describe("WHEN the submit button is clicked", () => {
      it("THEN does not fire dp-window-submit", () => {
        expect.assertions(1);
        const handler = vi.fn();
        el.addEventListener("dp-window-submit", handler);
        submitButton(el).click();
        expect(handler).not.toHaveBeenCalled();
      });

      it("THEN shows an inline error and shakes", async () => {
        expect.assertions(2);
        submitButton(el).click();
        await el.updateComplete;
        expect(errorRegion(el)).not.toBeNull();
        expect(
          el.shadowRoot!.querySelector("ha-dialog.dp-shaking")
        ).not.toBeNull();
      });

      it("THEN clears the error once the range becomes valid", async () => {
        expect.assertions(2);
        submitButton(el).click();
        await el.updateComplete;
        expect(errorRegion(el)).not.toBeNull();
        const endEl = el.shadowRoot!.querySelector(
          "#date-window-end"
        ) as HTMLInputElement;
        endEl.value = "2025-01-10T00:00";
        endEl.dispatchEvent(
          new Event("change", { bubbles: true, composed: true })
        );
        await el.updateComplete;
        expect(errorRegion(el)).toBeNull();
      });
    });
  });

  // ---------------------------------------------------------------------------
  // Edit mode — prefilled name preserved + same validation on Save
  // ---------------------------------------------------------------------------

  describe("GIVEN edit mode with a prefilled name", () => {
    beforeEach(async () => {
      el = createElement({
        ...VALID_RANGE,
        name: "Heating season",
        showDelete: true,
        submitLabel: "Save date window",
      });
      await el.updateComplete;
    });

    describe("WHEN dates change and the name prop is re-applied, then Save is clicked", () => {
      it("THEN Save emits the preserved prefilled name", async () => {
        expect.assertions(1);
        el.startValue = "2025-01-02T00:00";
        el.name = "Heating season";
        await el.updateComplete;
        const handler = vi.fn();
        el.addEventListener("dp-window-submit", handler);
        submitButton(el).click();
        expect(handler.mock.calls[0][0].detail.name).toBe("Heating season");
      });
    });

    describe("WHEN the name is cleared and Save is clicked", () => {
      it("THEN Save validates: no submit and an inline error is shown", async () => {
        expect.assertions(2);
        typeName(el, "");
        await el.updateComplete;
        const handler = vi.fn();
        el.addEventListener("dp-window-submit", handler);
        submitButton(el).click();
        await el.updateComplete;
        expect(handler).not.toHaveBeenCalled();
        expect(errorRegion(el)).not.toBeNull();
      });
    });
  });
});

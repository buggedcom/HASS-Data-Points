import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HistoryAnnotationDialogController } from "../annotation-dialog";

/** Create a minimal host element that the controller expects. */
function createHost() {
  const host = document.createElement("div");
  // Attach a real shadow root so the controller can append ha-dialog.
  host.attachShadow({ mode: "open" });
  host._hass = {
    callService: vi.fn(() => Promise.resolve()),
  };
  host._entityIds = ["sensor.temperature"];
  host._creatingContextAnnotation = false;
  document.body.appendChild(host);
  return host;
}

/** Minimal hover object that satisfies open(). */
function makeHover(overrides = {}) {
  return {
    timeMs: Date.now(),
    primary: null,
    event: null,
    annotationPrefill: null,
    ...overrides,
  };
}

describe("HistoryAnnotationDialogController", () => {
  let host;
  let controller;

  afterEach(() => {
    controller?.teardown();
    host?.remove();
  });

  describe("GIVEN a controller with a host element", () => {
    beforeEach(() => {
      host = createHost();
      controller = new HistoryAnnotationDialogController(host);
    });

    describe("WHEN ensureDialog() is called", () => {
      it("THEN appends an ha-dialog element to the host shadowRoot", () => {
        controller.ensureDialog();
        expect(host.shadowRoot.querySelector("ha-dialog")).toBeTruthy();
      });
    });

    describe("WHEN ensureDialog() is called twice", () => {
      it("THEN only one ha-dialog exists (idempotent)", () => {
        controller.ensureDialog();
        controller.ensureDialog();
        const dialogs = host.shadowRoot.querySelectorAll("ha-dialog");
        expect(dialogs.length).toBe(1);
      });
    });
  });

  describe("GIVEN dialog is open", () => {
    beforeEach(() => {
      host = createHost();
      controller = new HistoryAnnotationDialogController(host);
      controller.open(makeHover());
    });

    describe("WHEN close() is called", () => {
      it("THEN sets dialog.open to false", () => {
        controller.close();
        const dialog = host.shadowRoot.querySelector("ha-dialog");
        expect(dialog?.open).toBe(false);
      });
    });
  });

  describe("GIVEN dialog opened with prefill data", () => {
    const prefillMessage = "Test prefill message";

    beforeEach(() => {
      host = createHost();
      controller = new HistoryAnnotationDialogController(host);
      controller.open(
        makeHover({
          annotationPrefill: { message: prefillMessage },
        })
      );
    });

    describe("WHEN rendered", () => {
      it("THEN message field contains prefill text", () => {
        const panel = host.shadowRoot.querySelector(
          "#chart-context-dialog-panel"
        );
        const messageEl = panel?.querySelector("#chart-context-message");
        expect(messageEl?.value).toBe(prefillMessage);
      });
    });
  });

  describe("GIVEN dialog is open with empty message", () => {
    beforeEach(() => {
      host = createHost();
      controller = new HistoryAnnotationDialogController(host);
      controller.open(makeHover());
      // Ensure message is empty
      const panel = host.shadowRoot.querySelector(
        "#chart-context-dialog-panel"
      );
      const messageEl = panel?.querySelector("#chart-context-message");
      if (messageEl) messageEl.value = "";
    });

    describe("WHEN submit() is called", () => {
      it("THEN callService is NOT called", async () => {
        await controller.submit();
        expect(host._hass.callService).not.toHaveBeenCalled();
      });
    });
  });

  describe("GIVEN dialog is open with message filled", () => {
    beforeEach(() => {
      host = createHost();
      controller = new HistoryAnnotationDialogController(host);
      controller.open(makeHover());
      const panel = host.shadowRoot.querySelector(
        "#chart-context-dialog-panel"
      );
      const messageEl = panel?.querySelector("#chart-context-message");
      if (messageEl) messageEl.value = "Something happened";
    });

    describe("WHEN submit() is called", () => {
      it("THEN callService is invoked", async () => {
        await controller.submit();
        expect(host._hass.callService).toHaveBeenCalledOnce();
      });

      it("THEN callService is called with the correct service name", async () => {
        await controller.submit();
        const [, service] = host._hass.callService.mock.calls[0];
        expect(service).toBe("record");
      });

      it("THEN callService payload contains the message", async () => {
        await controller.submit();
        const [, , payload] = host._hass.callService.mock.calls[0];
        expect(payload.message).toBe("Something happened");
      });
    });
  });
});

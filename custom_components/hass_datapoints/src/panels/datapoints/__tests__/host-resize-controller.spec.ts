import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HostResizeController } from "../host-resize-controller";

type ResizeCb = () => void;

/** Minimal ReactiveControllerHost stand-in that records added controllers. */
function createHost() {
  const el = document.createElement("div") as HTMLElement & {
    addController: (c: unknown) => void;
    requestUpdate: () => void;
  };
  el.addController = vi.fn();
  el.requestUpdate = vi.fn();
  return el;
}

describe("HostResizeController", () => {
  let observed: HTMLElement[];
  let resizeCallbacks: ResizeCb[];
  let disconnect: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    observed = [];
    resizeCallbacks = [];
    disconnect = vi.fn();
    vi.stubGlobal(
      "ResizeObserver",
      class {
        constructor(cb: ResizeCb) {
          resizeCallbacks.push(cb);
        }

        observe(el: HTMLElement) {
          observed.push(el);
        }

        disconnect = disconnect;
      }
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  describe("GIVEN a connected host", () => {
    describe("WHEN the host resizes twice within a frame", () => {
      it("THEN it coalesces into a single debounced callback", () => {
        expect.assertions(3);
        const rafQueue: FrameRequestCallback[] = [];
        const rafSpy = vi
          .spyOn(window, "requestAnimationFrame")
          .mockImplementation((cb: FrameRequestCallback) => {
            rafQueue.push(cb);
            return rafQueue.length;
          });
        const host = createHost();
        const onResize = vi.fn();
        const controller = new HostResizeController(host, onResize);

        controller.hostConnected();
        expect(observed).toEqual([host]);

        resizeCallbacks[0]();
        resizeCallbacks[0]();
        // Both notifications scheduled only one frame.
        expect(rafQueue).toHaveLength(1);

        rafQueue[0](0);
        expect(onResize).toHaveBeenCalledTimes(1);
        rafSpy.mockRestore();
      });
    });

    describe("WHEN it is disconnected", () => {
      it("THEN it stops observing", () => {
        expect.assertions(1);
        const host = createHost();
        const controller = new HostResizeController(host, vi.fn());
        controller.hostConnected();

        controller.hostDisconnected();

        expect(disconnect).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe("GIVEN ResizeObserver is unavailable", () => {
    describe("WHEN the host connects", () => {
      it("THEN it is a no-op and does not throw", () => {
        expect.assertions(1);
        vi.stubGlobal("ResizeObserver", undefined);
        const host = createHost();
        const controller = new HostResizeController(host, vi.fn());

        expect(() => controller.hostConnected()).not.toThrow();
      });
    });
  });
});

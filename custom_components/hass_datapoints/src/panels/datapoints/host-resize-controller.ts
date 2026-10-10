import type { ReactiveController, ReactiveControllerHost } from "lit";

/**
 * Observes the host element's size and runs `onResize` (rAF-debounced) whenever
 * the host's box changes while it is connected.
 *
 * The Datapoints panel uses this for its measured-DOM layout side effects
 * (shell layout height, content split layout, chart resize redraw) instead of
 * an ad-hoc `window` "resize" listener, so container-driven size changes — a
 * collapsing sidebar, a split-pane drag — are picked up too, not just viewport
 * resizes. Reads/writes are batched into a single animation frame to avoid
 * layout thrash.
 */
export class HostResizeController implements ReactiveController {
  private readonly _host: ReactiveControllerHost & HTMLElement;

  private readonly _onResize: () => void;

  private _observer: Nullable<ResizeObserver> = null;

  private _rafId: Nullable<number> = null;

  constructor(
    host: ReactiveControllerHost & HTMLElement,
    onResize: () => void
  ) {
    this._host = host;
    this._onResize = onResize;
    host.addController(this);
  }

  hostConnected(): void {
    if (typeof window.ResizeObserver !== "function") {
      return;
    }
    this._observer = new ResizeObserver(() => this._schedule());
    this._observer.observe(this._host);
  }

  hostDisconnected(): void {
    this._observer?.disconnect();
    this._observer = null;
    if (this._rafId != null) {
      window.cancelAnimationFrame(this._rafId);
      this._rafId = null;
    }
  }

  private _schedule(): void {
    if (this._rafId != null) {
      return;
    }
    this._rafId = window.requestAnimationFrame(() => {
      this._rafId = null;
      this._onResize();
    });
  }
}

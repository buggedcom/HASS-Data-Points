import { buildChartCardShell, DOMAIN } from "../../lib/shared.js";

/**
 * ChartCardBase – shared base class for history and statistics chart cards.
 */

export class ChartCardBase extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._rendered = false;
    this._unsubscribe = null;
    this._resizeObserver = null;
    this._lastHistResult = null;
    this._lastEvents = null;
    this._lastT0 = null;
    this._lastT1 = null;
    this._chartHoverCleanup = null;
    this._chartZoomCleanup = null;
    this._loadRaf = null;
    this._lastDrawArgs = null;
    this._loadRequestId = 0;
    this._loadInFlight = false;
    this._hasStartedInitialLoad = false;
    this._windowListener = null;
    this._previousSeriesEndpoints = new Map();
  }

  get _entityIds() {
    return [];
  }

  set hass(hass) {
    this._hass = hass;
    if (!this._rendered) {
      this._rendered = true;
      this.shadowRoot.innerHTML = buildChartCardShell(this._config.title);
      this._setupAutoRefresh();
      this._setupResizeObserver();
      this._scheduleLoad();
      return;
    }
    if (this.isConnected && !this._hasStartedInitialLoad) this._scheduleLoad();
  }

  connectedCallback() {
    if (this._rendered && this._hass && !this._hasStartedInitialLoad) {
      this._scheduleLoad();
    }
  }

  disconnectedCallback() {
    if (this._loadRaf) {
      window.cancelAnimationFrame(this._loadRaf);
      this._loadRaf = null;
    }
    if (this._unsubscribe) { this._unsubscribe(); this._unsubscribe = null; }
    if (this._windowListener) {
      window.removeEventListener("hass-datapoints-event-recorded", this._windowListener);
      this._windowListener = null;
    }
    if (this._resizeObserver) { this._resizeObserver.disconnect(); this._resizeObserver = null; }
    if (this._chartHoverCleanup) { this._chartHoverCleanup(); this._chartHoverCleanup = null; }
    if (this._chartZoomCleanup) { this._chartZoomCleanup(); this._chartZoomCleanup = null; }
  }

  _setupAutoRefresh() {
    this._hass.connection.subscribeEvents(() => {
      this._load();
    }, `${DOMAIN}_event_recorded`).then((unsub) => {
      this._unsubscribe = unsub;
    }).catch(() => {});

    this._windowListener = () => {
      this._scheduleLoad();
    };
    window.addEventListener("hass-datapoints-event-recorded", this._windowListener);
  }

  _setupResizeObserver() {
    const wrap = this.shadowRoot.querySelector(".chart-wrap");
    if (!wrap || !window.ResizeObserver) return;
    this._resizeObserver = new ResizeObserver(() => {
      if (Array.isArray(this._lastDrawArgs) && this._lastDrawArgs.length) {
        this._drawChart(...this._lastDrawArgs);
      }
    });
    this._resizeObserver.observe(wrap);
  }

  _scheduleLoad() {
    if (!this._hass || this._loadRaf || this._loadInFlight) return;
    this._loadRaf = window.requestAnimationFrame(() => {
      this._loadRaf = null;
      if (!this._hass || !this.isConnected || this._loadInFlight) return;
      this._hasStartedInitialLoad = true;
      this._loadInFlight = true;
      Promise.resolve(this._load())
        .catch((err) => {
          console.error("[hass-datapoints chart-base] load failed", err);
        })
        .finally(() => {
          this._loadInFlight = false;
        });
    });
  }

  _setChartLoading(isLoading) {
    const loadingEl = this.shadowRoot?.getElementById("loading");
    if (!loadingEl) return;
    loadingEl.classList.toggle("active", !!isLoading);
  }

  _setChartMessage(message = "") {
    const messageEl = this.shadowRoot?.getElementById("chart-message");
    if (!messageEl) return;
    messageEl.textContent = message || "";
    messageEl.classList.toggle("visible", !!message);
  }
}

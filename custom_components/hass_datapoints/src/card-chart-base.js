/**
 * ChartCardBase – shared base class for history and statistics chart cards.
 */

class ChartCardBase extends HTMLElement {
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
      this._load();
    }
  }

  disconnectedCallback() {
    if (this._unsubscribe) { this._unsubscribe(); this._unsubscribe = null; }
    if (this._resizeObserver) { this._resizeObserver.disconnect(); this._resizeObserver = null; }
  }

  _setupAutoRefresh() {
    this._hass.connection.subscribeEvents(() => {
      this._load();
    }, `${DOMAIN}_event_recorded`).then((unsub) => {
      this._unsubscribe = unsub;
    }).catch(() => {});
  }

  _setupResizeObserver() {
    const wrap = this.shadowRoot.querySelector(".chart-wrap");
    if (!wrap || !window.ResizeObserver) return;
    this._resizeObserver = new ResizeObserver(() => {
      if (this._lastHistResult !== null) {
        this._drawChart(this._lastHistResult, this._lastEvents, this._lastT0, this._lastT1);
      }
    });
    this._resizeObserver.observe(wrap);
  }
}


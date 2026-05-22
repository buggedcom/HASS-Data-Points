/* Anatomy of the Datapoints panel — annotated screenshot tour. */

function Anatomy() {
  return (
    <section className="section" id="anatomy">
      <div className="container">
        <div className="section-head">
          <div className="eyebrow">
            <span className="dot"></span> The panel
          </div>
          <h2>Anatomy of the Datapoints panel.</h2>
          <p className="lead">
            A single dedicated history page brings together the timeline
            dragger, target rows, chart, datapoint list, and analysis controls.
            Every surface is connected — selecting a range on the timeline syncs
            the chart, clicking a datapoint scrolls the list, and saving a
            configuration creates an Anomaly Monitor device.
          </p>
        </div>

        <div className="anatomy-main">
          <div className="anatomy-frame">
            <div className="anatomy-chrome">
              <span className="dot-rgb r"></span>
              <span className="dot-rgb g"></span>
              <span className="dot-rgb b"></span>
              <span className="anatomy-url">
                Settings → Datapoints · Home Assistant
              </span>
            </div>
            <img
              src="images/panel-overview.png"
              alt="The Datapoints panel showing timeline, target rows, chart, and side controls"
            />

            {/* annotation callouts */}
            <span className="pin" style={{ top: "8%", left: "20%" }} data-n="1">
              <span className="pin-dot">1</span>
              <span className="pin-label">Timeline scrubber</span>
            </span>
            <span className="pin" style={{ top: "29%", left: "8%" }} data-n="2">
              <span className="pin-dot">2</span>
              <span className="pin-label">Analysis sidebar</span>
            </span>
            <span
              className="pin"
              style={{ top: "55%", left: "57%" }}
              data-n="3"
            >
              <span className="pin-dot">3</span>
              <span className="pin-label">Anomaly overlays</span>
            </span>
            <span
              className="pin pin--right"
              style={{ top: "8%", left: "92%" }}
              data-n="4"
            >
              <span className="pin-label">Monitor &amp; AI actions</span>
              <span className="pin-dot">4</span>
            </span>
            <span
              className="pin"
              style={{ top: "78%", left: "70%" }}
              data-n="5"
            >
              <span className="pin-dot">5</span>
              <span className="pin-label">Datapoint list</span>
            </span>
          </div>

          <ol className="anatomy-legend">
            <li>
              <span className="num">1</span>
              <div>
                <b>Timeline scrubber.</b> Drag either handle to define the
                analysis range. The chart, sidebar, and list all snap to your
                selection. Pan months at a glance, or zoom into hours.
              </div>
            </li>
            <li>
              <span className="num">2</span>
              <div>
                <b>Analysis sidebar.</b> Per-target controls for downsampling,
                trend method, anomaly methods, sensitivity, and rolling windows.
                Settings persist per series.
              </div>
            </li>
            <li>
              <span className="num">3</span>
              <div>
                <b>Anomaly overlays.</b> The blue ellipses are detected anomaly
                regions. Hover any one to see the alert and click <kbd>+</kbd>{" "}
                to record an annotation right there.
              </div>
            </li>
            <li>
              <span className="num">4</span>
              <div>
                <b>Monitor &amp; AI actions.</b> Save current config as an
                Anomaly Monitor device, copy a structured AI Query Brief, export
                a spreadsheet, or persist the page state.
              </div>
            </li>
            <li>
              <span className="num">5</span>
              <div>
                <b>Datapoint list.</b> All recorded annotations for the selected
                range, searchable and (for admins) editable inline. Click any
                row to jump the chart to it.
              </div>
            </li>
          </ol>
        </div>

        {/* secondary screenshots */}
        <div className="anatomy-secondary">
          <div className="anatomy-tile">
            <div className="anatomy-chrome small">
              <span className="anatomy-url">Anomaly monitors · list view</span>
            </div>
            <img
              src="images/monitors-list.png"
              alt="Anomaly monitor list with status pills and heatmap activity"
            />
            <div className="anatomy-cap">
              <b>Monitors as devices.</b> Each monitor exposes{" "}
              <span className="mono">switch.*</span> &amp;
              <span className="mono"> sensor.*</span> entities you can wire into
              automations.
            </div>
          </div>
          <div className="anatomy-tile">
            <div className="anatomy-chrome small">
              <span className="anatomy-url">
                Entity card · datapoints as activity feed
              </span>
            </div>
            <img
              src="images/activity-feed.png"
              alt="Entity popover showing activity feed of recorded datapoints"
            />
            <div className="anatomy-cap">
              <b>Datapoints as a logbook.</b> Every entity's activity feed
              surfaces datapoints linked to it — manual notes, automation
              captures, and detection events alike.
            </div>
          </div>
          <div className="anatomy-tile">
            <div className="anatomy-chrome small">
              <span className="anatomy-url">
                Anomaly monitor · creation wizard
              </span>
            </div>
            <img
              src="images/monitor-wizard.png"
              alt="Three-step anomaly monitor creation wizard"
            />
            <div className="anatomy-cap">
              <b>Three-step wizard.</b> Pick entities, configure detection per
              series, set the schedule. Choose Individual sensors (one device
              per entity) or Combined (one merged signal).
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

window.Anatomy = Anatomy;

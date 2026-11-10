/* Native MCP tools — Data Points analysis exposed through Home Assistant's MCP server */

const MCP_TOOLS = [
  {
    name: "analyze_chart",
    access: "Read-only",
    h: "Chart analysis",
    p: "Up to five rows over one window: history and sampling, summary statistics, all five trend methods, rate per hour, threshold spans, aligned comparisons and deltas, every anomaly method, and anomaly overlap across entities.",
  },
  {
    name: "aggregate_entity",
    access: "Read-only",
    h: "Calendar aggregates",
    p: "Minute to month intervals for measurements, state counts and durations, event counts and meter consumption, with time zone and DST handling, coverage, partial-period flags and meter-reset notes.",
  },
  {
    name: "list_events",
    access: "Read-only",
    h: "Recorded datapoints",
    p: "Browse annotations with optional entity and time filters. Global datapoints are included alongside entity-linked ones.",
  },
  {
    name: "list_monitors",
    access: "Read-only",
    h: "Anomaly monitors",
    p: "Active monitors with their methods, sensitivity, look-back, scan interval, last scan time and active cluster count.",
  },
  {
    name: "get_monitor_anomalies",
    access: "Read-only",
    h: "Monitor findings",
    p: "Saved cluster summaries and dismissed windows from a monitor's latest scan. No rescan happens; the scan time tells the assistant how fresh it is.",
  },
  {
    name: "record",
    access: "Writes",
    h: "Record a datapoint",
    p: "Creates an annotation through the existing record action, only when you ask for one. Each call creates a new datapoint.",
  },
];

const MCP_CALL = `{
  "start_time": "2026-11-03T00:00:00+02:00",
  "end_time":   "2026-11-10T00:00:00+02:00",
  "series": [{
    "entity_id": "sensor.living_room_temperature",
    "sample_interval": "15m",
    "trend_methods": ["lowess"],
    "comparison": {
      "entity_id":  "sensor.living_room_temperature",
      "start_time": "2026-10-27T00:00:00+02:00",
      "end_time":   "2026-11-03T00:00:00+02:00"
    },
    "anomalies": {
      "anomaly_methods": ["trend_residual", "comparison_window"],
      "anomaly_sensitivity": "medium"
    }
  }]
}`;

function mcpHL(src) {
  return src.split(/("(?:[^"\\]|\\.)*")(\s*:)?/g).map((part, i, arr) => {
    if (part === undefined || part === "") return null;
    if (/^\s*:$/.test(part)) return part;
    if (part.startsWith('"')) {
      const isKey = arr[i + 1] && /^\s*:$/.test(arr[i + 1]);
      return (
        <span key={i} className={isKey ? "k" : "s"}>
          {part}
        </span>
      );
    }
    return part;
  });
}

function McpTools() {
  return (
    <section className="section" id="mcp">
      <div className="container">
        <div className="section-head">
          <div className="eyebrow">
            <span className="dot"></span> Native MCP tools
          </div>
          <h2>Give your AI assistant the same analysis engine.</h2>
          <p className="lead">
            On Home Assistant 2026.11 or later, Data Points registers six tools
            with Home Assistant's own Model Context Protocol server. MCP clients
            discover them automatically and run the panel's trends, comparisons,
            anomaly detection and aggregates directly on your recorder history,
            instead of guessing from raw numbers.
          </p>
        </div>

        <div className="mcp-tools">
          {MCP_TOOLS.map((t) => (
            <div key={t.name} className="mcp-tool">
              <div className="mcp-tool-h">
                <span className="mono mcp-name">hass_datapoints__{t.name}</span>
                <span
                  className={
                    "power-badge" + (t.access === "Writes" ? " mcp-write" : "")
                  }
                >
                  {t.access}
                </span>
              </div>
              <h4>{t.h}</h4>
              <p>{t.p}</p>
            </div>
          ))}
        </div>

        <div className="mon-events mcp-demo">
          <div className="mon-events-copy">
            <div
              className="card-title"
              style={{ color: "var(--accent)", marginBottom: 8 }}
            >
              CONNECT A CLIENT
            </div>
            <h3>No extra server to run.</h3>
            <p>
              Home Assistant owns discovery, transport and authentication. Data
              Points only contributes the tools.
            </p>
            <ol className="mcp-steps">
              <li>Update to Home Assistant 2026.11 or later.</li>
              <li>Enable the Model Context Protocol Server integration.</li>
              <li>
                Copy the Home Assistant tool set URL from Settings → System →
                AI.
              </li>
              <li>Connect your MCP client with an administrator account.</li>
            </ol>
            <p className="mcp-fine">
              Using the main MCP URL with selected tool sets? Include Home
              Assistant. Its read-only option keeps the analysis and lookup
              tools and leaves out recording.
            </p>
          </div>
          <div className="mcp-chat">
            <div className="mcp-msg mcp-msg--user">
              Has the living room been warmer this week than last week? Flag
              anything unusual.
            </div>
            <div className="mcp-call">
              <div className="mcp-call-h">
                <span className="mono">hass_datapoints__analyze_chart</span>
              </div>
              <div className="code mon-code">{mcpHL(MCP_CALL)}</div>
            </div>
            <div className="mcp-msg">
              Mean 21.8 °C against 21.1 °C last week. The extra warmth is
              concentrated in the evenings, and Thursday 19:00 to 21:30 is
              flagged by both trend deviation and the comparison window.
            </div>
            <div className="mon-fine">
              Illustrative exchange. Values depend on your history.
            </div>
          </div>
        </div>

        <div className="mon-sub">
          <h3>Designed for assistants that act on data</h3>
        </div>
        <div className="mon-robust">
          <div>
            <h4>Administrators only</h4>
            <p>
              Every call checks that the connected user is a Home Assistant
              administrator. The tools sit in the Home Assistant tool set, not
              behind Assist's exposed-entity boundary.
            </p>
          </div>
          <div>
            <h4>Read-only by default</h4>
            <p>
              Five of the six tools only read. Recording is the single write, is
              marked as such for the client, and happens only when you ask for
              it.
            </p>
          </div>
          <div>
            <h4>Bounded work</h4>
            <p>
              A call covers up to 90 days, five series and 5,000 points per
              series, with a 30-second timeout and the same concurrency limit
              monitors use.
            </p>
          </div>
          <div>
            <h4>Paginated results</h4>
            <p>
              Every output array has its own total and continuation offset, so
              long histories and large anomaly clusters arrive in pieces instead
              of overflowing the context.
            </p>
          </div>
          <div>
            <h4>Honest about gaps</h4>
            <p>
              Missing history is reported, never treated as zero. Partial
              periods, meter resets and the age of saved monitor findings are
              all spelled out.
            </p>
          </div>
          <div>
            <h4>Pairs with the AI query brief</h4>
            <p>
              The tools cannot see what your browser has open. Paste the panel's
              AI query brief to hand over your selected entities, range and
              settings.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

window.McpTools = McpTools;

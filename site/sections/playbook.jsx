/* "What to do when you find an anomaly" — investigative playbook */

const playSteps = [
  {
    n: "01",
    title: "Don't fix yet. Investigate.",
    key: "Pause",
    body: "An anomaly is a signal, not a verdict. Before acting, expand the chart, hover the highlighted region, and read the values. A flagged spike during a known event isn't broken — it's expected.",
  },
  {
    n: "02",
    title: "Look across related entities.",
    key: "Correlate",
    body: "Open the same time range with the controlling entity, downstream sensors, and any window/door/valve contacts in the same area. A radiator anomaly that lines up with a window opening explains itself.",
  },
  {
    n: "03",
    title: "Compare to a known-good window.",
    key: "Baseline",
    body: "Load a saved date window from a normal period. Enable Comparison-window deviation and see whether the anomaly persists. If the baseline shows the same shape, you've found drift, not an event.",
  },
  {
    n: "04",
    title: "Record a datapoint with your hypothesis.",
    key: "Annotate",
    body: "Capture what you think happened, even if you're not sure. Future-you investigating a similar shape three months from now will thank present-you for leaving the breadcrumb on the chart.",
  },
  {
    n: "05",
    title: "Promote useful patterns to monitors.",
    key: "Automate",
    body: "If the anomaly type matters operationally — stuck sensors, valve drift, battery degradation — save it as an Anomaly Monitor. It becomes a Home Assistant device with sensors and switches you can trigger automations from.",
  },
  {
    n: "06",
    title: "Ask the AI for context.",
    key: "AI brief",
    body: "Use the AI Query Brief action to copy a structured prompt with entity metadata, query inputs, and current findings into your assistant of choice. Pair it with the spreadsheet export for raw numbers, or expose the integration through the Home Assistant MCP server so your agent can query monitor states and history live — turning anomaly reviews into a real conversation with the data.",
  },
];

function Playbook() {
  return (
    <section className="section" id="playbook">
      <div className="container">
        <div className="section-head">
          <div className="eyebrow">
            <span className="dot"></span> Playbook
          </div>
          <h2>So you found an anomaly. Now what?</h2>
          <p className="lead">
            Anomaly detection tells you where to look — not what to do. Here's
            the loop that turns a coloured region on a chart into operational
            understanding.
          </p>
        </div>

        <div className="playbook">
          {playSteps.map((s) => (
            <div key={s.n} className="play-step">
              <div className="num">{s.n}</div>
              <div>
                <h4>{s.title}</h4>
                <p>{s.body}</p>
                <span className="key">{s.key}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

window.Playbook = Playbook;

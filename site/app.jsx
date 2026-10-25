/* Top-level app composition */

function LangSwitcher() {
  const i18n = window.dpI18n;
  const [cur, setCur] = React.useState(i18n ? i18n.current : "en");
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);
  React.useEffect(() => i18n && i18n.onChange(setCur), []);
  React.useEffect(() => {
    if (!open) return;
    const f = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    const k = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", f);
    document.addEventListener("keydown", k);
    return () => {
      document.removeEventListener("mousedown", f);
      document.removeEventListener("keydown", k);
    };
  }, [open]);
  if (!i18n) return null;
  const avail = i18n.locales.filter((l) => l.code === "en" || i18n.has(l.code));
  if (avail.length < 2) return null;
  const loc = i18n.locales.find((l) => l.code === cur);
  return (
    <div className="lang" ref={ref} data-no-i18n="">
      <button
        className="nav-cta lang-btn"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Language"
        onClick={() => setOpen((o) => !o)}
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="12" cy="12" r="9"></circle>
          <path d="M3 12h18M12 3c2.5 2.7 2.5 15.3 0 18M12 3c-2.5 2.7-2.5 15.3 0 18"></path>
        </svg>
        {loc.short}
      </button>
      {open && (
        <ul className="lang-menu" role="listbox">
          {avail.map((l) => (
            <li key={l.code}>
              <button
                role="option"
                aria-selected={l.code === cur}
                className={l.code === cur ? "is-active" : ""}
                lang={l.html}
                onClick={() => {
                  i18n.set(l.code);
                  setOpen(false);
                }}
              >
                {l.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function App() {
  return (
    <>
      <nav className="nav">
        <div className="nav-inner">
          <a href="#top" className="brand">
            <span className="brand-mark"></span>
            <span>Data Points</span>
          </a>
          <div className="nav-links">
            <a href="#anatomy">Panel</a>
            <a href="#beyond">Datapoints</a>
            <a href="#detection">Detection</a>
            <a href="#aggregates">Aggregates</a>
            <a href="#monitors">Monitors</a>
            <a href="#playbook">Playbook</a>
            <a href="#install">Install</a>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <LangSwitcher />
            <a
              className="nav-cta"
              href="https://github.com/buggedcom/HASS-Data-Points"
              target="_blank"
              rel="noreferrer"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 .3a12 12 0 00-3.8 23.4c.6.1.8-.3.8-.6v-2.1c-3.3.7-4-1.6-4-1.6-.5-1.4-1.3-1.8-1.3-1.8-1.1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.8-1.6-2.7-.3-5.5-1.3-5.5-6 0-1.3.5-2.4 1.2-3.2-.1-.3-.5-1.5.1-3.2 0 0 1-.3 3.3 1.2a11.5 11.5 0 016 0c2.3-1.5 3.3-1.2 3.3-1.2.6 1.7.2 2.9.1 3.2.8.8 1.2 1.9 1.2 3.2 0 4.6-2.8 5.7-5.5 6 .4.4.8 1.1.8 2.3v3.4c0 .3.2.7.8.6A12 12 0 0012 .3" />
              </svg>
              GitHub
            </a>
          </div>
        </div>
      </nav>

      <main id="top">
        <Hero />
        <Overview />
        <WhatsNew />
        <Author />
        <Anatomy />
        <TimelineDragger />
        <Cards />
        <BeyondAnomalies />
        <Cookbook />
        <Detection />
        <Trends />
        <Aggregates />
        <PanelPowerTools />
        <Playbook />
        <Monitors />
        <Install />
      </main>

      <footer className="footer">
        <div className="container">
          <div className="row">
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  marginBottom: 8,
                }}
              >
                <span
                  className="brand-mark"
                  style={{ width: 20, height: 20 }}
                ></span>
                <b style={{ color: "var(--fg)" }}>Data Points</b>
              </div>
              An open-source Home Assistant integration. MIT-licensed.
            </div>
            <div className="links">
              <a href="https://github.com/buggedcom/HASS-Data-Points">GitHub</a>
              <a href="https://hacs.xyz">HACS</a>
              <a href="https://main--69cd024f27ae313c14343a9a.chromatic.com">
                Storybook
              </a>
              <a href="#install">Install</a>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);

/* About the Author — Oliver Lillie's bio + AI / curated framing */

function Author() {
  return (
    <section className="section section--tight" id="author">
      <div className="container">
        <div className="author-card">
          <div className="author-grid">
            <div className="author-avatar">
              <div className="author-avatar-inner">
                <span className="author-initials">OL</span>
              </div>
              <div className="author-avatar-glow"></div>
            </div>

            <div className="author-meta">
              <div className="eyebrow" style={{ marginBottom: 10 }}>
                <span className="dot"></span> Built by AI · curated by a
                software developer
              </div>
              <h2
                style={{
                  fontSize: "clamp(28px, 3.4vw, 44px)",
                  marginBottom: 14,
                }}
              >
                Velocity from AI.
                <br />
                Judgement from <em>20+ years of shipping software.</em>
              </h2>
              <p
                style={{
                  fontSize: 17,
                  color: "var(--fg-mute)",
                  lineHeight: 1.6,
                  maxWidth: "62ch",
                  textWrap: "pretty",
                }}
              >
                Data Points is built with the assistance of modern AI tooling —
                but every architectural decision, every API contract, every
                test, and every visual detail is reviewed, validated, and
                curated by a developer who's been in the trenches since 2004. AI
                moves fast; judgement keeps it from breaking your home.
              </p>

              <div className="author-id">
                <div className="author-id-name">Oliver Lillie</div>
                <div className="author-id-title">
                  Team Lead · Senior Developer · Designer
                </div>
                <div className="author-id-loc">
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  Helsinki, Finland
                </div>
              </div>

              <div className="author-facts">
                <AuthorFact v="20+" l="Years in web & software" />
                <AuthorFact v="53+" l="Projects shipped" />
                <AuthorFact v="1.7M" l="Users on platforms built / led" />
                <AuthorFact v="2004" l="Started development career" />
              </div>

              <div className="author-stack">
                <span
                  className="card-title"
                  style={{ display: "block", marginBottom: 8 }}
                >
                  STACK · LAST 5 YEARS
                </span>
                <div className="author-stack-pills">
                  <span>TypeScript</span>
                  <span>Vue 3</span>
                  <span>React</span>
                  <span>LIT web components</span>
                  <span>Node.js</span>
                  <span>C#</span>
                  <span>Python</span>
                  <span>PHP</span>
                  <span>Storybook</span>
                  <span>PostgreSQL</span>
                  <span>Figma</span>
                  <span>Design systems</span>
                </div>
              </div>

              <div className="author-roles">
                <AuthorRole
                  org="Mitsubishi Logisnext (via Mavericks)"
                  role="Senior Developer & Designer · Frontend monorepo lead"
                  when="2023 — Present"
                />

                <AuthorRole
                  org="New Things Co · Nuuka Solutions"
                  role="Team Lead, Senior Developer & UI/UX · BI dashboard for building energy analytics"
                  when="2019 — 2023"
                />

                <AuthorRole
                  org="Online Scout Manager"
                  role="Senior Full-stack Developer & Designer · SaaS used by 95% of UK scouting"
                  when="2015 — 2019"
                />

                <AuthorRole
                  org="Freelance · UK"
                  role="Architect / lead dev on national-scale voting, ticketing & CMS systems"
                  when="2004 — 2015"
                />
              </div>

              <div className="author-links">
                <a
                  className="btn btn--ghost"
                  href="https://github.com/buggedcom"
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
                <a
                  className="btn btn--ghost"
                  href="https://www.linkedin.com/in/oliverlillie/"
                  target="_blank"
                  rel="noreferrer"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M19 3a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h14zM8.34 17V10H5.67v7h2.67zM7 8.86a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM18.34 17v-3.83c0-2.4-1.28-3.5-2.99-3.5-1.38 0-2 .76-2.34 1.3V10H10v7h2.67v-3.91c0-.24.02-.47.09-.65.18-.47.62-.95 1.34-.95.95 0 1.33.7 1.33 1.73V17h2.91z" />
                  </svg>
                  LinkedIn
                </a>
                <a className="btn btn--ghost" href="mailto:hi@oliverlillie.com">
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <path d="M22 6L12 13 2 6" />
                  </svg>
                  hi@oliverlillie.com
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function AuthorFact({ v, l }) {
  return (
    <div className="author-fact">
      <div className="author-fact-v">{v}</div>
      <div className="author-fact-l">{l}</div>
    </div>
  );
}

function AuthorRole({ org, role, when }) {
  return (
    <div className="author-role">
      <div className="author-role-when">{when}</div>
      <div className="author-role-body">
        <div className="author-role-org">{org}</div>
        <div className="author-role-role">{role}</div>
      </div>
    </div>
  );
}

window.Author = Author;

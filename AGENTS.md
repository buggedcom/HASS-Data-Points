# AGENTS.md

## Repository Conventions

- Use `pnpm` for Node-based workflows.
- Prefer placing utility scripts, pure helpers, and simple shared functions under `custom_components/hass_datapoints/src/lib/`.
- Never use shortcut `if` / `else` clauses or single-line conditional bodies.
- Always include explicit opening and closing braces for every conditional block, including `if`, `else if`, and `else`.

## Test Generation Requirements

- Use Vitest for frontend and library tests.
- Name test files with the `.spec.ts` extension.
- Prefer testing pure functions and library functions in `src/lib/`.
- Colocate tests with the code they exercise. Keep specs inside a `__tests__` directory within the tested area.
- Structure test context with `describe` blocks using GIVEN / WHEN / AND phrasing.
- Keep `it(...)` titles focused on the THEN outcome only.
- Every test must include explicit `expect(...)` usage.
- Use `expect.assertions(<count>)` at the start of each test with the exact assertion count for that case.
- When adding or updating tests, follow the existing repository style before introducing new patterns.

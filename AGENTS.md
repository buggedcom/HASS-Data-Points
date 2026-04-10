# AGENTS.md

## Purpose

This repository contains the frontend and integration code for `hass_datapoints`, a Home Assistant custom integration focused on:

- interactive history charting
- annotation / datapoint creation and browsing
- target-row driven chart configuration
- comparison date windows
- reusable UI primitives for Home Assistant-flavoured Lit components

This file is the working project guide for contributors and coding agents. Use it as the source of truth for architecture, directory structure, component boundaries, testing, stories, and library placement.

---

## Core Tooling

- Use `pnpm` for Node-based workflows.
- Use Vitest for unit/spec coverage.
- Use Storybook for component stories and interaction coverage.
- Prefer `rg` for search and `rg --files` for file discovery.

### Main verification commands

1. `pnpm build`
2. `pnpm test`
3. `pnpm vitest run <focused spec files>`
4. `pnpm sb:build`

When making scoped changes, run focused Vitest first, then `pnpm build`, then broader verification as needed.

---

## Repository Conventions

- Prefer placing utility scripts, pure helpers, and simple shared functions under `custom_components/hass_datapoints/src/lib/`.
- Never use shortcut `if` / `else` clauses or single-line conditional bodies.
- Always include explicit opening and closing braces for every conditional block, including `if`, `else if`, and `else`.
- Avoid duplicating types across component, story, and test files.
- Prefer direct file imports over barrel imports unless a compatibility barrel already exists for a deliberate boundary.
- Runtime imports generally use `@/…` aliases. Styles imports stay relative.

---

## Architecture Overview

The UI layer is intentionally split by responsibility:

- `src/atoms`
  Smallest reusable UI primitives.
  Examples: inputs, toggles, handles, simple display widgets.

- `src/molecules`
  Composed reusable units built from atoms.
  Examples: target rows, chart shell, comparison tabs, sidebar sections.

- `src/cards`
  Self-contained Lovelace / records-style feature cards that are not chart implementations.
  Examples: action, dev-tool, list, quick.

- `src/charts`
  Larger chart-oriented feature surfaces and chart cards.
  Includes the history chart/card stack plus sensor/history chart surfaces.

- `src/panels`
  Full page/panel composition.
  The primary page is `panels/datapoints/datapoints.js`.

- `src/components`
  Integration-specific larger shared pieces that do not fit cleanly as atoms/molecules/cards.
  Current example: annotation dialog controller surface.

- `src/lib`
  Pure helpers, domain transforms, HA API utilities, state/session helpers, chart helpers, workers, i18n runtime, and general reusable logic.

### Layering guidance

- Atoms should not own page-level state.
- Molecules should compose atoms and emit clean events rather than reaching deep into child DOM.
- Cards should orchestrate feature-specific UI and behavior, but should still extract repeated subparts into atoms/molecules where reuse emerges.
- Panels own app/session state, URL state, and composition.
- `src/lib` should hold logic that can be tested without full DOM rendering whenever possible.

---

## Component vs Atom vs Molecule vs Card vs Page

### Atoms

Use an atom when:

- the UI is a single primitive or close to it
- the component is intended to be reused in many places
- the API can stay narrow and prop-driven
- the component should not know panel/page business rules

Examples:

- `atoms/form/radio-group`
- `atoms/interactive/range-handle`
- `atoms/display/feedback-banner`

### Molecules

Use a molecule when:

- you are composing two or more atoms into a reusable unit
- the unit has small internal interaction logic
- the unit still represents a reusable pattern rather than a page-specific feature shell

Examples:

- `molecules/target-row`
- `molecules/comparison-tab-rail`
- `molecules/sidebar-options`
- `molecules/panel-timeline`

### Cards

Use a card when:

- the unit is a user-facing feature surface with meaningful orchestration
- it owns feature-specific UI, config, or behavior
- it is not just a generic composition primitive

Examples:

- `cards/action`
- `cards/dev-tool`
- `cards/list`
- `cards/quick`
- `cards/history/history.ts`
- `cards/sensor/sensor.ts`

### Pages / Panels

Use a panel/page component when:

- the surface owns routing, URL/session state, layout, and feature composition
- it coordinates chart, sidebar, toolbar, list, dialogs, and persistent state

Primary example:

- `panels/datapoints/datapoints.js`

---

## Directory Structure Conventions

### General component directory structure

Preferred structure for reusable UI:

```text
src/<layer>/<component-name>/
├── <component-name>.ts
├── <component-name>.styles.ts
├── i18n/                        # optional but preferred for component-local translations
│   ├── fi.ts
│   └── fr.ts
├── types.ts                     # optional but preferred when types are shared
├── __tests__/
│   └── <component-name>.spec.ts
└── stories/
    └── <component-name>.stories.ts
```

### Localization structure

Frontend component translations now live next to the component they belong to in a local `i18n/` directory.

- Prefer `src/<layer>/<component-name>/i18n/<locale>.ts` for component-local Lit strings.
- Keep Home Assistant integration/service translations in `custom_components/hass_datapoints/translations/<locale>.json`.
- Do not add new frontend locale files under `src/lib/i18n/locales/`; that area is now only for locale loader wiring.

### Subcomponents

If a component becomes large, split it into nested subcomponent directories rather than keeping multiple unrelated concerns in one file.

Examples already following this pattern:

- `src/cards/action/action-targets/`
- `src/cards/dev-tool/dev-tool-results/`
- `src/cards/dev-tool/dev-tool-windows/`
- `src/cards/list/list-edit-form/`
- `src/cards/list/list-event-item/`
- `src/cards/quick/quick-annotation/`
- `src/cards/sensor/sensor-chart/`
- `src/cards/sensor/sensor-header/`
- `src/cards/sensor/sensor-record-item/`
- `src/cards/sensor/sensor-records/`
- `src/cards/history/history-chart/`

### Panel component structure

Panel-specific components live under:

```text
src/panels/datapoints/components/
```

Current notable panel components:

- `panel-shell`
- `history-targets`
- `range-toolbar`

### History card support structure

The history card area has dedicated internal helper directories:

```text
src/cards/history/
├── analysis/    # frontend analysis helpers still required by the chart
├── data/        # history/statistics normalization and extent logic
├── history-chart/
├── __tests__/
└── stories/
```

### Library structure

`src/lib` is organized by domain rather than by consumer:

- `lib/chart`
  Shared chart interaction/render helpers
- `lib/data`
  HA API fetchers and data access helpers
- `lib/domain`
  domain-level transforms and state logic
- `lib/ha`
  Home Assistant-specific helpers
- `lib/history-page`
  session/page state helpers for the datapoints history surface
- `lib/i18n`
  frontend localization runtime and locale wiring
- `lib/timeline`
  timeline-specific calculations/helpers
- `lib/util`
  small reusable utilities
- `lib/workers`
  worker entry points and worker client helpers

If code can be pure and shared, prefer placing it in `src/lib` instead of embedding it in components.

---

## Naming Conventions

### Current component naming

This repo has moved away from `Dp`/`dp-` and `card-` export prefixes in most active code.

- Prefer export names like `PanelShell`, `RangeToolbar`, `HistoryChart`, `SensorChart`.
- Custom element tags must still contain a hyphen.

### Compatibility / exceptions

- Some older integration-facing tags still keep `hass-datapoints-*` names intentionally.
- Be careful around chart/history internals and existing Home Assistant registration names.
- Do not rename stable public integration tags casually.

---

## Code Style Rules

- **Curly braces are mandatory** for all `if`, `else`, `for`, `while`, and similar block statements.
- **No type duplication between stories and components.**
  Shared types should live in `types.ts` where practical.
- **Externalize CSS into a separate styles file.**
  Never keep inline `static styles = css\`...\`` in component logic files.
- **Derive props from `stateObj` where possible.**
  If HA state already contains the data, do not add redundant public props.

### Lit property guidance

For Lit components extending `LitElement`:

- Use explicit reactive defaults.
- Keep one consistent reactive property pattern within a class.
- Use decorators where the repo supports them for that area.
- Avoid constructor-based default assignment for reactive fields unless there is a specific Lit/runtime reason.
- Internal reactive state should stay internal and not be exposed as public API accidentally.

### Event boundaries

- Prefer component events and clean public props over parent components reaching into child shadow DOM.
- Avoid deep selector-based control when a component event or public method can express the contract.
- If a parent must coordinate behavior, use a narrow public method rather than arbitrary DOM traversal.

---

## CSS / Styling Rules

- Every component should have a dedicated `*.styles.ts` file when it owns styles.
- Style imports should be relative imports.
- Follow the established sibling pattern:

```ts
import { styles } from "./component-name.styles";
```

- Reuse the existing visual language where appropriate.
- For panel-related UI, refer back to the historical panel CSS source when reproducing selectors and spacing:
  `custom_components/hass_datapoints/src/panels/datapoints/datapoints.js`

### Important note

The old `PANEL_HISTORY_STYLE` block still matters as a source of truth for many selectors and layout rules. When extracting panel-related components, mirror the matching selectors carefully rather than inventing new structure arbitrarily.

---

## i18n Guidance

The frontend uses `@lit/localize` in **runtime mode**. Source locale is English. Supported translated locales: **de, es, fi, fr, pt, zh-hans**.

### How it works

`src/lib/i18n/localize.ts` configures the localization runtime once. When the HA user's locale matches a supported locale, `setLocale("<code>")` is called and the locale chunk is loaded asynchronously. Components decorated with `@localized()` re-render automatically when the locale changes.

### String wrapping rules

Every user-visible string in a component must be wrapped with `msg()`:

```typescript
import { msg, localized } from "@/lib/i18n/localize";

@localized()
class MyElement extends LitElement {
  render() {
    return html`<button>${msg("Save page state")}</button>`;
  }
}
```

**`msg()` cannot wrap template literals with runtime expressions.** For interpolated strings use numbered placeholders and a `t()` helper:

```typescript
function t(key: string, ...values: string[]): string {
  let s = msg(key, { id: key });
  values.forEach((v, i) => {
    s = s.replace(new RegExp(`\\{${i}\\}`, "g"), v);
  });
  return s;
}

// Usage
t("Anomaly at {0} with severity {1}", time, severity);
```

**Module-level arrays cannot use `msg()`** because the runtime is not yet loaded at module initialization. Build option arrays inside a method or getter so `msg()` is called at render time:

```typescript
// Wrong — msg() not yet active when the module loads
const OPTIONS = [{ label: msg("Hour"), value: "hour" }];

// Correct — msg() is called at render time via _localizedOptions()
private _localizedOptions() {
  return [{ label: msg("Hour"), value: "hour" }];
}
```

### Co-located translation files

Each component owns its translations in an `i18n/` subdirectory next to the component source, one file per locale:

```text
src/molecules/analysis-anomaly-group/
├── analysis-anomaly-group.ts
└── i18n/
    ├── de.ts
    ├── es.ts
    ├── fi.ts
    ├── fr.ts
    ├── pt.ts
    └── zh-hans.ts
```

Every translation file exports a `translations` object typed as `ComponentTranslations`:

```typescript
import type { ComponentTranslations } from "@/lib/i18n/types";

export const translations: ComponentTranslations = {
  "Show anomalies": "Näytä poikkeamat",
  Sensitivity: "Herkkyys",
};
```

Keys are the English source strings exactly as they appear in `msg()` calls. Values are the translated equivalents.

### Adding new strings

When you add a new `msg("Some string")` call to a component, you **must** add the translation to **all six** locale files in that component's `i18n/` directory. Leave no locale file missing a key — missing keys silently fall back to English but the files should be kept in sync.

### Auto-discovery — no registration needed

`src/lib/i18n/locales/<locale>.ts` uses `import.meta.glob` to merge every `i18n/<locale>.ts` file across the whole `src/` tree at build time. There is nothing to register: dropping a correctly structured file into the component's `i18n/` directory is sufficient.

Duplicate keys are resolved by last-writer-wins (`Object.assign`). This is safe because any shared key (e.g. `"1 hour"`) carries the same translation regardless of which component declares it.

### Adding i18n to a new component

1. Add `@localized()` to the component class.
2. Import `msg` (and `localized`) from `@/lib/i18n/localize`.
3. Wrap every user-visible string in `msg()`.
4. For interpolated strings, use the `t()` pattern with `{0}`, `{1}` … placeholders.
5. Create `<component-name>.i18n.fi.ts` next to the component source with all Finnish translations.
6. Run `pnpm build` — the file is auto-discovered.

### General rules

- Source strings live inline in component code, not in a separate strings file.
- Keep English source strings clear and naturally readable — they are the display strings for English users.
- Do not mix in ad hoc translation systems for new work.
- If a reusable atom/molecule should stay generic (no locale dependency), pass already-resolved strings from the owner. This avoids forcing every atom to carry `@localized()`.
- Keep HA backend translation files (`translations/en.json` etc.) separate from frontend component localization.

---

## Test Requirements

- Use Vitest for frontend and library tests.
- Name test files with the `.spec.ts` extension.
- Colocate tests with the code they exercise.
- Keep specs inside a `__tests__` directory within the tested area.
- Structure test context with `describe` blocks using GIVEN / WHEN / AND phrasing.
- Keep `it(...)` titles focused on the THEN outcome only.
- Every test must include explicit `expect(...)` usage.
- Use `expect.assertions(<count>)` at the start of each test with the exact assertion count for that case.
- Prefer per-file specs over broad barrel-style tests.

### Testing priorities

1. Pure helpers in `src/lib`
2. Component event contracts and rendering behavior
3. Regressions around panel/chart coordination
4. Storybook `play` coverage for important interaction flows

### Practical testing guidance

- When you split a file, split its tests too.
- When moving logic from a barrel file into dedicated modules, create per-module specs.
- When fixing a regression, add a focused regression test in the nearest relevant area.
- If a component has subcomponents, prefer separate subcomponent specs instead of only parent-level coverage.

### Bug fix regression tests (mandatory)

Every bug fix **must** be accompanied by a GIVEN / WHEN / THEN regression test that would have caught the bug before it was fixed.

Structure:

```typescript
describe("GIVEN <the precondition that sets up the scenario>", () => {
  describe("WHEN <the action or input that triggered the bug>", () => {
    it("THEN <the correct observable outcome that was previously broken>", () => {
      expect.assertions(1);
      // …
    });
  });
});
```

Rules:

- The test **must fail** on the unfixed code and **pass** after the fix.
- One focused test per bug — do not bundle unrelated regressions into the same `it`.
- Place it in the spec file nearest to the fixed code (colocated `__tests__` directory).
- The describe labels should describe the bug scenario in plain language, not the implementation detail.
- Prefer testing the observable contract (rendered output, emitted event, returned value) over internal state.

---

## Storybook Requirements

- Components should have existing story coverage where practical.
- Do not create grouped “bucket” story files for unrelated components.
- Put stories on the component they belong to.
- Prefer interaction coverage in existing component story files rather than separate grouped interaction stories.
- Keep stories colocated in `stories/`.

### Story expectations

- Stories should render in Home Assistant theme context.
- Important interactive components should have `play` coverage.
- Stories should exercise real component states, not just static snapshots.

---

## New Component Checklist

1. Create the component in the correct layer: atom, molecule, card, chart, or panel component.
2. Add a co-located `*.styles.ts` file.
3. Add `types.ts` if types are shared by stories/tests/related subcomponents.
4. Add a co-located spec in `__tests__/`.
5. Add or update a component story in `stories/`.
6. If the component has user-visible strings:
   - Add `@localized()` decorator and import `msg` from `@/lib/i18n/localize`.
   - Wrap every user-visible string in `msg()`.
   - Create `<component-name>.i18n.fi.ts` with Finnish translations for every wrapped string.
7. Run focused Vitest.
8. Run `pnpm build`.
9. If the component is user-facing and interactive, run Storybook verification too.
10. For panel/history changes, verify manually in HA.

---

## Atoms in Molecules Rule

When building molecules, always use the existing atoms instead of raw HTML when an atom already covers the pattern.

| UI Pattern                          | Atom tag                     | Import path (from `src/`)                                             | Props                                                           | Event emitted                                         |
| ----------------------------------- | ---------------------------- | --------------------------------------------------------------------- | --------------------------------------------------------------- | ----------------------------------------------------- |
| Group of radio buttons              | `dp-radio-group`             | `atoms/form/dp-radio-group/dp-radio-group`                            | `name: string`, `value: string`, `options: SelectOption[]`      | `dp-radio-change → { value: string }`                 |
| Group of checkboxes                 | `dp-checkbox-list`           | `atoms/form/dp-checkbox-list/dp-checkbox-list`                        | `items: CheckboxItem[]`                                         | `dp-item-change → { name: string, checked: boolean }` |
| Sidebar section with title/subtitle | `dp-sidebar-options-section` | `atoms/display/dp-sidebar-options-section/dp-sidebar-options-section` | `title: string`, `subtitle: string` + default `<slot>` for body | _(none)_                                              |
| Section heading only                | `dp-sidebar-section-header`  | `atoms/display/dp-sidebar-section-header/dp-sidebar-section-header`   | `title: string`, `subtitle: string`                             | _(none)_                                              |

### Types

- `SelectOption`
  `{ label: string; value: string }` from `@/lib/types`
- `CheckboxItem`
  exported from the checkbox list component

### Legacy HTML to atom mapping

- `.sidebar-radio-group` / `.sidebar-radio-option` inputs → `dp-radio-group`
- `.sidebar-toggle-group` / `.sidebar-toggle-option` inputs → `dp-checkbox-list`
- `.sidebar-options-section` wrapper → `dp-sidebar-options-section`
- `.sidebar-section-header` / related title/subtitle markup → `dp-sidebar-section-header`

### Rule

Never write raw `<input type="radio">` or `<input type="checkbox">` lists directly in a molecule when an existing atom already covers the use case.

---

## Current Project Structure Snapshot

High-level current structure under `custom_components/hass_datapoints/src/`:

```text
src/
├── atoms/
├── cards/
├── charts/
├── components/
├── contexts/
├── docs/
├── lib/
├── molecules/
├── panels/
└── test-support/
```

Notable active areas:

- `atoms/analysis`
- `atoms/display`
- `atoms/form`
- `atoms/interactive`
- `cards/action`
- `cards/dev-tool`
- `cards/history`
- `cards/list`
- `cards/quick`
- `cards/sensor`
- `charts/base`
- `charts/utils`
- `panels/datapoints`

---

## Tests and Stories Coverage Notes

The repo already has broad colocated coverage.

Patterns currently in use:

- most reusable atoms have both `__tests__` and `stories`
- most active molecules have both `__tests__` and `stories`
- cards generally have parent specs/stories plus nested subcomponent specs/stories where split out
- chart helper modules under `cards/history/analysis` and `cards/history/data` use per-file specs
- `src/lib` has broad per-file or per-area test coverage under nested `__tests__`

When adding to an area that already has colocated tests/stories, follow the existing local structure first.

---

## Library Guidance

Prefer `src/lib` for:

- pure formatting and color utilities
- HA navigation and naming helpers
- chart interaction helpers
- domain transforms
- session state serialization
- URL/query parsing
- worker client orchestration

Avoid placing domain logic inside components when it can be extracted and tested in `src/lib`.

### History chart specifics

Frontend history-chart code still owns:

- rendering
- zoom / hover interaction
- normalization and extent calculations still needed client-side
- frontend-only analysis helpers that are still used

Do not assume backend support means all frontend chart logic can be removed. Check actual call sites before deleting frontend helpers.

---

## Practical Refactor Rules

- Split large files by responsibility, not arbitrarily.
- If a component contains repeated sub-UI with its own behavior, extract a subcomponent directory.
- If duplicate UI appears across cards, prefer a shared atom or molecule.
- If code is no longer needed because backend or shared logic replaced it, remove it and remove its tests too.
- Keep compatibility barrels only when they serve a deliberate migration boundary.

---

## Verification Checklist For Component / Chart / Panel Work

### For component work

1. Focused Vitest for touched areas
2. Storybook story exists or is updated
3. `pnpm build`

### For chart work

1. Focused chart/history specs
2. `pnpm build`
3. Manual HA verification for hover, zoom, legend, comparison tabs, and overlays when relevant

### For panel work

1. Focused panel specs
2. `pnpm build`
3. Manual HA verification for sidebar behavior, tabs, range toolbar, split panes, and chart/list coordination

---

## Bulk Action Checklist

After any task that touches multiple files — new features, refactors, adding fields, renaming, adding translations — always run these two commands as the final step before finishing:

```bash
pnpm format        # auto-fixes Prettier and ESLint formatting in one pass
pnpm lint:types    # TypeScript type-check across the whole project
```

Both must pass clean before the work is considered done. If `lint:types` reports errors, fix them before stopping. If `format` rewrites files, stage the changes.

---

## Final Rule Of Thumb

When in doubt:

- put pure logic in `src/lib`
- keep atoms small and prop-driven
- keep molecules event-driven
- keep cards feature-focused
- keep pages/panels as composition/state owners
- colocate tests and stories with the thing they exercise
- prefer smaller, verified refactors over giant rewrites

---

## Pull Request Priority

Pull requests with **🤖🤖🤖** in the title are given attention first.

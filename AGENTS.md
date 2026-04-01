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

## New Components Checklist

1. `pnpm build` — no errors
2. `pnpm test` — all tests pass (unit spec tests + Storybook interaction tests via Playwright)
3. Open Storybook — stories render correctly with HA theme; all play functions pass in the Interactions panel
4. After integration steps: manual verification in HA

---

## Code Style Rules

- **Curly braces are mandatory** for all `if`, `else`, `for`, `while`, and similar block statements — even single-line bodies. Never omit braces. Example:
  ```ts
  // ✅ correct
  if (condition) {
    doSomething();
  }

  // ❌ wrong
  if (condition) doSomething();
  ```

- **No type duplication between stories and components.** Shared types must live in a single source of truth:
    - Prefer a `types.ts` file co-located with the component (e.g. `src/molecules/dp-target-row/types.ts`).
    - The component file imports from `./types` and re-exports any types that consumers need.
    - Stories and test files import types from `"../types"` (or `"../../dp-target-row/types"` for sibling molecules) — never redeclare them locally.
    - The `HassEntityState` interface lives in `src/molecules/dp-target-row/types.ts` and should be reused wherever an HA state object is typed.

- **Externalise CSS into a separate styles file.** Never write `static styles = css\`...\`` inline in the component file. Instead:
    - Create a co-located `dp-component-name.styles.ts` file that exports a named `styles` constant.
    - Import and assign it in the component: `static styles = styles;`
    - Example file structure:
      ```
      src/molecules/dp-component-name/
      ├── dp-component-name.ts          # component logic + template only
      ├── dp-component-name.styles.ts   # static styles = css`...`
      ├── types.ts                      # shared interfaces
      ├── stories/
      │   └── dp-component-name.stories.ts
      └── __tests__/
          └── dp-component-name.spec.ts
      ```
    - Example styles file:
      ```ts
      import { css } from "lit";
  
      export const styles = css`
        :host { display: block; }
        /* ... */
      `;
      ```
    - Example component import:
      ```ts
      import { styles } from "./dp-component-name.styles";
      // ...
      static styles = styles;
      ```

- **Derive props from `stateObj` where possible.** If a value is already present on the HA entity state object (`stateObj`), do not add a separate prop for it. Use a private getter to derive it:
    - `entity_id` → `private get _entityId()` from `stateObj.entity_id`
    - `friendly_name` → `private get _entityName()` from `stateObj.attributes.friendly_name`
    - `unit_of_measurement` → `private get _unit()` from `stateObj.attributes.unit_of_measurement`
    - `icon` → passed directly to `ha-state-icon` via `.stateObj`; no separate icon prop needed
    - Analysis expansion state (`expanded`) lives in `analysis.expanded` — no separate `analysisExpanded` prop

---

## Atom Component Mapping

When building molecules, **always use the existing atoms** instead of writing raw HTML form elements.

| UI Pattern | Atom tag | Import path (from `src/`) | Props | Event emitted |
|---|---|---|---|---|
| Group of radio buttons | `dp-radio-group` | `atoms/form/dp-radio-group/dp-radio-group` | `name: string`, `value: string`, `options: SelectOption[]` | `dp-radio-change → { value: string }` |
| Group of checkboxes | `dp-checkbox-list` | `atoms/form/dp-checkbox-list/dp-checkbox-list` | `items: CheckboxItem[]` | `dp-item-change → { name: string, checked: boolean }` |
| Sidebar section with title/subtitle | `dp-sidebar-options-section` | `atoms/display/dp-sidebar-options-section/dp-sidebar-options-section` | `title: string`, `subtitle: string` + default `<slot>` for body | _(none)_ |
| Section heading only | `dp-sidebar-section-header` | `atoms/display/dp-sidebar-section-header/dp-sidebar-section-header` | `title: string`, `subtitle: string` | _(none)_ |

**Types:**
- `SelectOption` — `{ label: string; value: string }` from `@/lib/types`
- `CheckboxItem` — `{ name: string; label: string; checked: boolean }` exported from `dp-checkbox-list.ts`

**Legacy HTML → atom mapping:**
- `.sidebar-radio-group` / `.sidebar-radio-option` inputs → `dp-radio-group`
- `.sidebar-toggle-group` / `.sidebar-toggle-option` inputs → `dp-checkbox-list`
- `.sidebar-options-section` wrapper (title + subtitle + body) → `dp-sidebar-options-section`
- `.sidebar-section-header` / `.sidebar-section-title` / `.sidebar-section-subtitle` → `dp-sidebar-section-header`

**Rule:** Never write raw `<input type="radio">` or `<input type="checkbox">` lists directly in a molecule when these atoms cover the use case. If a checkbox group has a dependent sub-option (e.g. a select that appears when a checkbox is on), render the `dp-checkbox-list` first and place the sub-option as a sibling element beneath it.

---

## Key CSS Files to Reference

All CSS lives in `PANEL_HISTORY_STYLE` constant, defined at line 166 of:
`custom_components/hass_datapoints/src/components/panel-history/panel-history.js`

Each component must extract and replicate the exact CSS selectors from this constant that correspond to the HTML it renders.

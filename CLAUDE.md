# CLAUDE.md — HASS Data Points

Developer and AI-agent guide for the `hass_datapoints` custom component.

---

## Project overview

A Home Assistant custom component that adds custom-event recording and rich history visualization to HA dashboards. The frontend is a self-contained LIT 3 component library built with TypeScript and Vite, bundled as a single JS resource loaded by HA.

**Stack:** LIT 3.3, TypeScript, Vitest (browser + JSDOM), Storybook 8, pnpm, Python (backend).

---

## Dev commands

All commands are run from the repo root unless noted.

| Command           | Purpose                                                 |
| ----------------- | ------------------------------------------------------- |
| `pnpm build`      | Build JS bundle + copy to HA custom-component directory |
| `pnpm test`       | Run all tests (Vitest unit + Storybook + Python)        |
| `pnpm test:unit`  | Run only unit/browser Vitest tests                      |
| `pnpm test:sb`    | Run only Storybook interaction tests                    |
| `pnpm test:watch` | Watch mode (all tests)                                  |
| `pnpm sb`         | Start Storybook dev server on port 6006                 |
| `pnpm dev:watch`  | Watch + auto-sync JS bundle to HA                       |
| `pnpm lint`       | ESLint + package-json lint + Prettier check + tsc       |
| `pnpm lint:types` | TypeScript type check only (`tsc --noEmit`)             |
| `pnpm format`     | Auto-fix ESLint + Prettier                              |
| `pnpm test:py`    | Run Python backend tests                                |

---

## Component hierarchy

Atomic design with four layers:

```
atoms/       — Single-responsibility UI primitives (inputs, displays)
molecules/   — Composed groups of atoms with local logic
cards/       — HA lovelace card entrypoints (history, action, quick, sensor, list, dev-tool)
panels/      — Full HA panel pages (datapoints)
```

Support directories:

- `src/lib/` — utilities, API calls, domain logic, i18n
- `src/charts/` — chart rendering and base class (`ChartCardBase`)
- `src/components/` — non-card UI components (annotation dialog, etc.)

---

## Component creation conventions

1. **File structure** — each component lives in its own directory: `component-name.ts`, `component-name.styles.ts`, and optionally `stories/`, `__tests__/`, `i18n/`.
2. **`accessor` keyword** — all `@property` and `@state` fields use the `accessor` keyword (required by LIT 3 with `experimentalDecorators: true`).
3. **`customElements.define`** — always at the bottom of the file, after the class declaration.
4. **Styles** — defined in a separate `.styles.ts` file and imported as `styles`.
5. **Side-effect imports** — import child custom element files with `import "@/path/to/element"` at the top of the parent's `.ts` file.
6. **No `@state` for derived values** — use `willUpdate()` to compute derived state into plain class fields; `@state` triggers a second render cycle.

---

## Event contract

All interactive form atoms fire a single unified event:

```ts
"dp-change"; // CustomEvent<DpChangeDetail>
```

Defined in `src/lib/events.ts`. The `type` field discriminates the payload:

| type            | detail shape                                        |
| --------------- | --------------------------------------------------- |
| `"select"`      | `{ type: "select"; value: string }`                 |
| `"field"`       | `{ type: "field"; value: string }`                  |
| `"switch"`      | `{ type: "switch"; checked: boolean }`              |
| `"number"`      | `{ type: "number"; value: string }`                 |
| `"color"`       | `{ type: "color"; color: string }`                  |
| `"check"`       | `{ type: "check"; checked: boolean }`               |
| `"item"`        | `{ type: "item"; value: string; checked: boolean }` |
| `"entity"`      | `{ type: "entity"; value: string }`                 |
| `"entity-list"` | `{ type: "entity-list"; value: string[] }`          |
| `"datetime"`    | `{ type: "datetime"; value: string }`               |
| `"icon"`        | `{ type: "icon"; value: string }`                   |
| `"radio"`       | `{ type: "radio"; value: string }`                  |

Consumers cast to the known sub-type:

```ts
@dp-change=${(e: CustomEvent<DpChangeDetail>) =>
  this._set("x", (e.detail as { type: "switch"; checked: boolean }).checked)}
```

Analysis-group molecules fire `dp-group-analysis-change` with `{ entityId, key, value }` via the `AnalysisGroupMixin`.

---

## Mixin pattern

Shared logic for the 7 analysis-group molecules lives in `src/molecules/analysis-group-shared/analysis-group.mixin.ts`:

```ts
export const AnalysisGroupMixin = <T extends Constructor<LitElement>>(Base: T) => {
  abstract class Mixin extends Base { ... }
  return Mixin as unknown as typeof Mixin & T & Constructor<AnalysisGroupMixinInterface>;
};
```

The `@localized()` decorator is applied to the **final class**, not inside the mixin:

```ts
@localized()
export class AnalysisFooGroup extends AnalysisGroupMixin(LitElement) { ... }
```

---

## Testing conventions

- **Framework**: Vitest browser mode (atoms/molecules) + Storybook interaction tests (stories).
- **Structure**: Given / When / Then describe blocks.
- **Helper**: `createElement(tag, props?)` from `src/test-support/` creates and connects elements.
- **Event simulation**: dispatch `CustomEvent` on child elements to test parent handlers.
- **No mocking of the database or HA websocket in unit tests** — use fixture objects instead.

---

## Story conventions

- **Format**: CSF3 (`export default { ... }`, `export const StoryName = { ... }`).
- **Localized components**: add `setFrontendLocale` via the `loaders` array (see existing stories).
- **Hass-dependent components**: use `mock-hass.ts` from `src/test-support/`.
- **No `accessor` keyword in story files** — the Storybook vitest indexer does not support it. Inline demo classes in stories must use plain class fields.
- **Naming**: story files live in a `stories/` subdirectory: `component-name/stories/component-name.stories.ts`.

---

## Python backend

- Backend lives in `custom_components/hass_datapoints/` (Python files).
- Tests in `tests/` use pytest; run with `pnpm test:py`.
- Install deps: `pnpm py:install` (creates `.venv`).

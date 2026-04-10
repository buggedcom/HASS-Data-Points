# Development

This document covers local development setup, the frontend source layout, internationalisation, remote HA development, the WebSocket API, and CI/release notes.

---

## Setup

```bash
git clone https://github.com/buggedcom/HASS-Data-Points.git
cd HASS-Data-Points
corepack enable
pnpm install
pnpm hooks:install
```

---

## Build

```bash
pnpm build
```

The built frontend bundle is committed to the repo as:

```text
custom_components/hass_datapoints/hass-datapoints-cards.js
```

---

## Tests

```bash
pnpm test
pnpm vitest run <focused spec files>
```

---

## Storybook

The published Storybook for the `main` branch is available at:
**<https://main--69cd024f27ae313c14343a9a.chromatic.com>**

To run Storybook locally or build it:

```bash
pnpm sb
pnpm sb:build
```

---

## Frontend source layout

The frontend lives in:

```text
custom_components/hass_datapoints/src/
```

Current top-level structure:

```text
src/
├── atoms/
├── cards/
├── charts/
├── components/
├── lib/
├── molecules/
├── panels/
└── test-support/
```

| Directory            | Contents                                                                       |
| -------------------- | ------------------------------------------------------------------------------ |
| `atoms/`             | Reusable UI primitives                                                         |
| `molecules/`         | Composed reusable UI units                                                     |
| `cards/`             | Feature cards — action, quick, list, dev tool, history, statistics, sensor     |
| `charts/`            | Shared chart infrastructure — base classes, DOM helpers, interaction utilities |
| `panels/datapoints/` | The dedicated Datapoints history page                                          |
| `lib/`               | Shared chart logic, HA helpers, domain logic, workers, i18n, and utilities     |

---

## Internationalisation (i18n)

The frontend uses [`@lit/localize`](https://lit.dev/docs/localization/overview/) in **runtime mode**.

**Source locale:** English (`en`) — all user-visible strings in the source code are written in English.  
**Supported translated locales:** German (`de`), Spanish (`es`), Finnish (`fi`), French (`fr`), Portuguese (`pt`), Simplified Chinese (`zh-Hans`).

The canonical list of supported locales is maintained in a single file:

```
src/lib/i18n/supported-locales.json
```

Both `localize.ts` and the translation coverage tests read from this file, so adding a locale there is the only registration step needed.

### How the runtime works

`src/lib/i18n/localize.ts` calls `configureLocalization` once at startup. The user's Home Assistant UI language is read from `hass.locale.language` (falling back to `hass.language`) and normalised to the nearest supported locale — for example `fr-CA` resolves to `fr`. The matching locale chunk is then lazy-loaded and components decorated with `@localized()` re-render automatically.

Every user-visible string is wrapped with `msg()`:

```typescript
import { msg, localized } from "@/lib/i18n/localize";

@localized()
class MyElement extends LitElement {
  render() {
    return html`<span>${msg("Save page state")}</span>`;
  }
}
```

Interpolated strings that contain runtime values cannot be passed directly to `msg()`. Use numbered placeholders and a `t()` helper instead:

```typescript
function t(key: string, ...values: string[]): string {
  let s = msg(key, { id: key });
  values.forEach((v, i) => {
    s = s.replace(new RegExp(`\\{${i}\\}`, "g"), v);
  });
  return s;
}

// Usage
t("Anomaly at {0} with value {1}", formattedTime, formattedValue);
```

### Co-located translation files

Translations are **not** in a single central locale file. Each component that has translatable strings owns an `i18n/` subdirectory containing one file per locale:

```text
src/molecules/target-row/
├── target-row.ts
└── i18n/
    ├── de.ts
    ├── es.ts
    ├── fi.ts
    ├── fr.ts
    ├── pt.ts
    └── zh-hans.ts
```

Every locale file exports a `translations` object typed as `ComponentTranslations`:

```typescript
import type { ComponentTranslations } from "@/lib/i18n/types";

export const translations: ComponentTranslations = {
  "Show anomalies": "Näytä anomaliat",
  Sensitivity: "Herkkyys",
};
```

### Auto-discovery at build time

Each `src/lib/i18n/locales/<locale>.ts` file uses `import.meta.glob` to discover and merge every matching `i18n/<locale>.ts` file across the entire source tree:

```typescript
// src/lib/i18n/locales/fi.ts
const modules = import.meta.glob<{ translations: Record<string, string> }>(
  "../../../**/i18n/fi.ts",
  { eager: true }
);

const merged: Record<string, string> = {};
for (const mod of Object.values(modules)) {
  Object.assign(merged, mod.translations);
}

export const templates = merged satisfies LocaleModule["templates"];
```

No manual registration is needed. Creating an `i18n/fi.ts` file anywhere under `src/` is sufficient for its strings to be included in the built locale chunk.

Duplicate keys are resolved by last-writer-wins (`Object.assign`). This is safe because any shared key (e.g. `"Auto"`) carries the same translated value regardless of which component declares it.

### Translation coverage tests

`src/lib/i18n/__tests__/translations-coverage.spec.ts` enforces three rules across every component `i18n/` directory automatically:

1. **Locale presence** — every supported locale file must exist.
2. **Key completeness** — every locale file must contain exactly the same set of keys (no missing translations, no stale extras left over after a key is renamed or removed).
3. **Value completeness** — every translated value must differ from its English source key, unless the string is listed in `UNTRANSLATED_WHITELIST` (reserved for technical terms, proper nouns, and abbreviations that are genuinely the same across languages).

Run the tests with `pnpm test` to catch any gaps before committing.

### Adding translations to a new component

1. Create an `i18n/` subdirectory next to the component source file.
2. Add a `<locale>.ts` file for **each** locale listed in `supported-locales.json`.
3. Each file exports a `translations` object with the same keys (English source string → translated value).
4. Wrap every user-visible string in the component with `msg()` and add `@localized()` to the class.
5. Run `pnpm test` — the coverage tests will fail immediately if any locale file is missing or has mismatched keys.

### Adding a new locale

1. Add the locale code to `src/lib/i18n/supported-locales.json`.
2. Create `src/lib/i18n/locales/<locale>.ts` with the `import.meta.glob` pattern above, substituting the new locale code.
3. Add a `case` for the new locale in the `loadLocale` switch in `localize.ts`.
4. Add a normalisation branch in `normalizeLocale` in `localize.ts` to map BCP 47 variants (e.g. `pt-BR`) to the canonical code.
5. Add an `i18n/<locale>.ts` file to every component directory that already has an `i18n/` subdirectory — the coverage tests will list exactly which ones are missing.

### Translation quality note

The English translations were written by a native speaker. Finnish translations were written by a non-native speaker. All other bundled locales are currently **machine-translated** — they are included so the UI is usable out of the box in more Home Assistant setups, but they should be treated as reasonable defaults rather than fully reviewed translations.

Translation improvements for any locale are welcome — edit the relevant `i18n/<locale>.ts` and json files and open a pull request.

---

## Remote Home Assistant development

If you use a remote HA instance for development:

1. Copy the example env file:

```bash
cp .env.dev.example .env.dev
```

2. Fill in the remote host details.
3. Sync manually:

```bash
pnpm dev:sync
```

4. Or run watch mode:

```bash
pnpm dev:watch
```

---

## WebSocket API

The frontend uses the following WebSocket commands:

| Type                            | Purpose                              |
| ------------------------------- | ------------------------------------ |
| `hass_datapoints/events`        | Fetch recorded datapoints/events     |
| `hass_datapoints/events/update` | Update an existing datapoint (admin) |
| `hass_datapoints/events/delete` | Delete a datapoint (admin)           |
| `hass_datapoints/history`       | Fetch history/downsampled chart data |
| `hass_datapoints/anomalies`     | Fetch backend anomaly results        |

Events are stored in:

```text
.storage/hass_datapoints.events
```

---

## Release and CI notes

- CI checks build correctness and integration metadata.
- The built frontend bundle is committed as `custom_components/hass_datapoints/hass-datapoints-cards.js`.
- Pre-commit hooks format staged files, lint package.json versions, validate frontend types, and rebuild the frontend when needed.
- Pre-push hooks run tests, lint checks, package.json version linting, and frontend type validation before pushing.

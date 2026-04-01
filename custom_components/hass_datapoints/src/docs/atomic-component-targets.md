# Atomic Component Targets — Extended Extraction Plan

This document identifies additional atoms and molecules to extract, following the same
red/green/refactor TDD workflow established in the main `AGENTS.md` plan.
It supplements that plan and does **not** amend it.

---

## Design Principles Applied

1. **Every function that returns HTML must become a component.**  
   Functions like `renderAnalysisSelectOptions()`, `renderTargetChips()`, and
   every `innerHTML = \`…\`` block are the primary extraction targets.

2. **A `<dp-form-group>` atom wraps any form field that needs an optional label + slot.**  
   This is the canonical replacement for raw `<div class="context-form-field">`,
   `<label class="history-target-analysis-field">`, and similar containers.

3. **All new components follow the TypeScript-first rule** — `.ts` files only.

---

## New Atoms

### Display

| Component | Props | Extracted from |
|-----------|-------|----------------|
| `<dp-form-group>` | `label?: string`, `description?: string` + default slot | `<div class="context-form-field">` in `annotation-dialog.js`; `<label class="history-target-analysis-field">` in `panel-history.js`; editor `<div class="ed">` sub-sections |
| `<dp-sidebar-section-header>` | `title: string`, `subtitle?: string` | `.sidebar-section-header` + `.sidebar-section-title` + `.sidebar-section-subtitle` repeated throughout `panel-history.js` |
| `<dp-empty-state>` | `message: string` | `.history-target-empty` in `_renderTargetRows()`; the `<ha-card class="empty">` block in `_renderContent()` |

```
src/atoms/display/dp-form-group/
├── dp-form-group.ts
├── dp-form-group.stories.ts
└── __tests__/
    └── dp-form-group.spec.ts

src/atoms/display/dp-sidebar-section-header/
├── dp-sidebar-section-header.ts
├── dp-sidebar-section-header.stories.ts
└── __tests__/
    └── dp-sidebar-section-header.spec.ts

src/atoms/display/dp-empty-state/
├── dp-empty-state.ts
├── dp-empty-state.stories.ts
└── __tests__/
    └── dp-empty-state.spec.ts
```

---

### Interactive

| Component | Props | Events | Extracted from |
|-----------|-------|--------|----------------|
| `<dp-toggle-switch>` | `checked: boolean`, `label: string`, `entityId?: string` | `dp-toggle-change` | `.history-target-visible-toggle` (checkbox + CSS track) in `_renderTargetRows()`; collapsed summary item toggles |
| `<dp-drag-handle>` | `label?: string` | `dp-drag-start`, `dp-drag-end` | `.history-target-drag-handle` button with `mdi:drag-vertical` in `_renderTargetRows()` |
| `<dp-page-menu-item>` | `icon: string`, `label: string`, `disabled?: boolean` | `dp-menu-action` | `.page-menu-item` in the page header action menu in `panel-history.js` |

```
src/atoms/interactive/dp-toggle-switch/
├── dp-toggle-switch.ts
├── dp-toggle-switch.stories.ts
└── __tests__/
    └── dp-toggle-switch.spec.ts

src/atoms/interactive/dp-drag-handle/
├── dp-drag-handle.ts
├── dp-drag-handle.stories.ts
└── __tests__/
    └── dp-drag-handle.spec.ts

src/atoms/interactive/dp-page-menu-item/
├── dp-page-menu-item.ts
├── dp-page-menu-item.stories.ts
└── __tests__/
    └── dp-page-menu-item.spec.ts
```

---

### Form

| Component | Props | Events | Extracted from |
|-----------|-------|--------|----------------|
| `<dp-inline-select>` | `value: string`, `options: Array<{value, label}>`, `disabled?: boolean` | `dp-select-change` | `<select class="history-target-analysis-select">` + the `renderAnalysisSelectOptions()` helper function in `panel-history.js`. **`renderAnalysisSelectOptions` must be deleted once this exists.** |
| `<dp-number-input>` | `value: string`, `placeholder?: string`, `suffix?: string`, `step?: string` | `dp-number-change` | `<input class="history-target-analysis-input" type="number">` in threshold analysis rows of `panel-history.js` |
| `<dp-analysis-checkbox>` | `checked: boolean`, `label: string`, `disabled?: boolean`, `helpText?: string`, `helpId?: string` | `dp-check-change` | `<label class="history-target-analysis-option">` rows (with optional `ha-tooltip` for help) throughout `_renderTargetRows()` |
| `<dp-radio-group>` | `name: string`, `value: string`, `options: Array<{value, label}>` | `dp-radio-change` | `.sidebar-radio-group` + `.sidebar-radio-option` pattern in `_renderSidebarOptions()` |
| `<dp-checkbox-list>` | `items: Array<{name, label, checked}>` | `dp-item-change` (detail: `{name, checked}`) | `.sidebar-toggle-group` + `.sidebar-toggle-option` pattern in `_renderSidebarOptions()` |
| `<dp-color-picker-field>` | `color: string`, `entityId?: string`, `hass?: HomeAssistant` | `dp-color-change` | `.history-target-color-field` (native color input + ha-state-icon overlay) in `_renderTargetRows()` |

```
src/atoms/form/dp-inline-select/
├── dp-inline-select.ts
├── dp-inline-select.stories.ts
└── __tests__/
    └── dp-inline-select.spec.ts

src/atoms/form/dp-number-input/
├── dp-number-input.ts
├── dp-number-input.stories.ts
└── __tests__/
    └── dp-number-input.spec.ts

src/atoms/form/dp-analysis-checkbox/
├── dp-analysis-checkbox.ts
├── dp-analysis-checkbox.stories.ts
└── __tests__/
    └── dp-analysis-checkbox.spec.ts

src/atoms/form/dp-radio-group/
├── dp-radio-group.ts
├── dp-radio-group.stories.ts
└── __tests__/
    └── dp-radio-group.spec.ts

src/atoms/form/dp-checkbox-list/
├── dp-checkbox-list.ts
├── dp-checkbox-list.stories.ts
└── __tests__/
    └── dp-checkbox-list.spec.ts

src/atoms/form/dp-color-picker-field/
├── dp-color-picker-field.ts
├── dp-color-picker-field.stories.ts
└── __tests__/
    └── dp-color-picker-field.spec.ts
```

---

## New Molecules

### `<dp-analysis-group>` — Collapsible analysis section

**Extracted from:** the repeated pattern inside `_renderTargetRows()` in `panel-history.js`
where each analysis feature (trend lines, rate of change, threshold, anomalies, delta)
renders as a collapsible group: a primary checkbox that acts as the toggle, and a
`<div class="history-target-analysis-group-body">` that appears when checked.

| Props | Events |
|-------|--------|
| `entityId: string`, `optionKey: string`, `label: string`, `checked: boolean`, `alignTop?: boolean` | `dp-analysis-group-change` (detail: `{entityId, key, checked}`) |
| default slot for sub-options shown only when `checked` | — |

```
src/molecules/dp-analysis-group/
├── dp-analysis-group.ts
├── dp-analysis-group.stories.ts
└── __tests__/
    └── dp-analysis-group.spec.ts
```

---

### `<dp-analysis-panel>` — Per-series analysis configuration panel

**Extracted from:** the `history-target-analysis` + `history-target-analysis-grid` block
inside `_renderTargetRows()`.  Composes multiple `<dp-analysis-group>`,
`<dp-analysis-checkbox>`, `<dp-analysis-select-field>`, and `<dp-number-input>` atoms.

| Props | Events |
|-------|--------|
| `entityId: string`, `analysis: NormalizedHistorySeriesAnalysis`, `canShowDeltaAnalysis: boolean`, `comparisonWindows: ComparisonWindow[]`, `unit?: string` | `dp-analysis-change` (detail: `{entityId, key, value}`) |

```
src/molecules/dp-analysis-panel/
├── dp-analysis-panel.ts
├── dp-analysis-panel.stories.ts
└── __tests__/
    └── dp-analysis-panel.spec.ts
```

---

### `<dp-target-row>` — Single history target row

**Extracted from:** `.history-target-row` inside `_renderTargetRows()`.
Composes `<dp-drag-handle>`, `<dp-color-picker-field>`, `<dp-toggle-switch>`,
`<dp-analysis-panel>`, and a remove icon button.

| Props | Events |
|-------|--------|
| `row: HistorySeriesRow`, `index: number`, `hass: HomeAssistant`, `selectedComparisonWindowId?: string`, `comparisonWindows: ComparisonWindow[]` | `dp-row-color-change`, `dp-row-visibility-change`, `dp-row-analysis-change`, `dp-row-remove`, `dp-row-reorder` |

```
src/molecules/dp-target-row/
├── dp-target-row.ts
├── dp-target-row.stories.ts
└── __tests__/
    └── dp-target-row.spec.ts
```

---

### `<dp-target-row-list>` — List of target rows

**Extracted from:** `_renderTargetRows()` in `panel-history.js`.
Composes `<dp-target-row>` items with drag-to-reorder logic and an
empty state via `<dp-empty-state>`.

| Props | Events |
|-------|--------|
| `rows: HistorySeriesRow[]`, `hass: HomeAssistant`, `selectedComparisonWindowId?: string`, `comparisonWindows: ComparisonWindow[]` | `dp-rows-change` (detail: `{rows: HistorySeriesRow[]}`) |

```
src/molecules/dp-target-row-list/
├── dp-target-row-list.ts
├── dp-target-row-list.stories.ts
└── __tests__/
    └── dp-target-row-list.spec.ts
```

---

### `<dp-sidebar-options>` — Chart display options sidebar card

**Extracted from:** `_renderSidebarOptions()` in `panel-history.js`.
Composes three `<dp-sidebar-section-header>` + `<dp-radio-group>` / `<dp-checkbox-list>` blocks.

| Props | Events |
|-------|--------|
| `datapointScope: string`, `showIcons: boolean`, `showLines: boolean`, `showTooltips: boolean`, `showHoverGuides: boolean`, `showCorrelatedAnomalies: boolean`, `showDataGaps: boolean`, `dataGapThreshold: string`, `delinkYAxis: boolean`, `splitView: boolean` | `dp-scope-change`, `dp-display-change` (detail: `{kind, value}`) |

```
src/molecules/dp-sidebar-options/
├── dp-sidebar-options.ts
├── dp-sidebar-options.stories.ts
└── __tests__/
    └── dp-sidebar-options.spec.ts
```

---

### `<dp-comparison-tab>` — Single comparison window tab

**Extracted from:** the `.chart-tab` template inside `_renderComparisonTabs()`.

| Props | Events |
|-------|--------|
| `tabId: string`, `label: string`, `detail?: string`, `active?: boolean`, `previewing?: boolean`, `loading?: boolean`, `editable?: boolean` | `dp-tab-activate`, `dp-tab-hover`, `dp-tab-leave`, `dp-tab-edit`, `dp-tab-delete` |

```
src/molecules/dp-comparison-tab/
├── dp-comparison-tab.ts
├── dp-comparison-tab.stories.ts
└── __tests__/
    └── dp-comparison-tab.spec.ts
```

---

### `<dp-comparison-tab-rail>` — Scrollable comparison tab strip

**Extracted from:** `_renderComparisonTabs()` (`chart-tabs-shell` + `chart-tabs-rail`
+ add button). Composes `<dp-comparison-tab>` items.

| Props | Events |
|-------|--------|
| `tabs: ComparisonTabItem[]`, `loadingIds: string[]`, `hoveredId?: string` | `dp-tab-activate`, `dp-tab-hover`, `dp-tab-leave`, `dp-tab-edit`, `dp-tab-delete`, `dp-tab-add` |

```
src/molecules/dp-comparison-tab-rail/
├── dp-comparison-tab-rail.ts
├── dp-comparison-tab-rail.stories.ts
└── __tests__/
    └── dp-comparison-tab-rail.spec.ts
```

---

### `<dp-date-window-dialog>` — Create / edit date window dialog

**Extracted from:** `_ensureDateWindowDialog()` + the open/close/submit logic
in `panel-history.js`. The `innerHTML` block for the dialog content becomes
the `render()` method of a LitElement.

| Props | Events |
|-------|--------|
| `open: boolean`, `editingWindow?: ComparisonWindow`, `draftRange?: DateRange`, `comparisonWindows: ComparisonWindow[]` (for shortcut navigation context) | `dp-window-submit` (detail: `{label, start, end, id?}`), `dp-window-delete` (detail: `{id}`), `dp-window-close` |

```
src/molecules/dp-date-window-dialog/
├── dp-date-window-dialog.ts
├── dp-date-window-dialog.stories.ts
└── __tests__/
    └── dp-date-window-dialog.spec.ts
```

---

### `<dp-annotation-chip>` — Single removable annotation target chip

**Extracted from:** `renderTargetChips()` in `annotation-dialog.js`.
The `.context-chip` pattern: ha-icon + label text + remove button.
**`renderTargetChips()` must be deleted once this exists.**

| Props | Events |
|-------|--------|
| `type: string`, `itemId: string`, `icon: string`, `name: string` | `dp-chip-remove` (detail: `{type, itemId}`) |

Note: this is distinct from `<dp-entity-chip>` (which is HA-aware and looks up
entity state). `<dp-annotation-chip>` is stateless — it receives pre-resolved
icon and name.

```
src/atoms/interactive/dp-annotation-chip/
├── dp-annotation-chip.ts
├── dp-annotation-chip.stories.ts
└── __tests__/
    └── dp-annotation-chip.spec.ts
```

---

### `<dp-annotation-chip-row>` — Group of annotation target chips

**Extracted from:** `renderTargetChips()` + the `<div id="chart-context-linked-targets">`
container in `annotation-dialog.js`.  Composes `<dp-annotation-chip>` items plus an
empty-state message when the target has no entries.

| Props | Events |
|-------|--------|
| `target: TargetSelection`, `hass: HomeAssistant`, `label?: string`, `helpText?: string` | `dp-target-remove` (detail: `{type, id}`) |

```
src/molecules/dp-annotation-chip-row/
├── dp-annotation-chip-row.ts
├── dp-annotation-chip-row.stories.ts
└── __tests__/
    └── dp-annotation-chip-row.spec.ts
```

---

### `<dp-floating-menu>` — Positioned floating overlay panel

**Extracted from:** `.page-menu` and the range `.range-picker-menu` / `.range-options-menu`
pattern. A host button slot + a positioned floating `<slot name="content">` that
appears/disappears with focus-trap and outside-click dismissal.

| Props | Events |
|-------|--------|
| `open: boolean`, `anchorSelector?: string` | `dp-menu-close` |
| `slot="trigger"` — the button that opens the menu | — |
| `slot="content"` — the menu body | — |

```
src/molecules/dp-floating-menu/
├── dp-floating-menu.ts
├── dp-floating-menu.stories.ts
└── __tests__/
    └── dp-floating-menu.spec.ts
```

---

## Implementation Order

Extract in dependency order (atoms before molecules that compose them):

| Step | Component | Depends on |
|------|-----------|------------|
| 1 | `<dp-form-group>` | — |
| 2 | `<dp-sidebar-section-header>` | — |
| 3 | `<dp-empty-state>` | — |
| 4 | `<dp-toggle-switch>` | — |
| 5 | `<dp-drag-handle>` | — |
| 6 | `<dp-page-menu-item>` | — |
| 7 | `<dp-inline-select>` | — (replaces `renderAnalysisSelectOptions`) |
| 8 | `<dp-number-input>` | — |
| 9 | `<dp-analysis-checkbox>` | — |
| 10 | `<dp-radio-group>` | — |
| 11 | `<dp-checkbox-list>` | — |
| 12 | `<dp-color-picker-field>` | — |
| 13 | `<dp-annotation-chip>` | — (replaces `renderTargetChips` partially) |
| 14 | `<dp-analysis-group>` | `<dp-analysis-checkbox>`, `<dp-inline-select>` |
| 15 | `<dp-analysis-panel>` | `<dp-analysis-group>`, `<dp-number-input>`, `<dp-analysis-checkbox>`, `<dp-inline-select>` |
| 16 | `<dp-target-row>` | `<dp-drag-handle>`, `<dp-color-picker-field>`, `<dp-toggle-switch>`, `<dp-analysis-panel>` |
| 17 | `<dp-target-row-list>` | `<dp-target-row>`, `<dp-empty-state>` |
| 18 | `<dp-sidebar-options>` | `<dp-sidebar-section-header>`, `<dp-radio-group>`, `<dp-checkbox-list>`, `<dp-inline-select>` |
| 19 | `<dp-comparison-tab>` | — |
| 20 | `<dp-comparison-tab-rail>` | `<dp-comparison-tab>` |
| 21 | `<dp-annotation-chip-row>` | `<dp-annotation-chip>`, `<dp-form-group>` |
| 22 | `<dp-date-window-dialog>` | `<dp-form-group>`, `<dp-date-time-input>` (existing) |
| 23 | `<dp-floating-menu>` | — |

---

## Functions to Delete After Migration

| Function | Location | Replaced by |
|----------|----------|-------------|
| `renderAnalysisSelectOptions()` | `panel-history.js` | `<dp-inline-select>` |
| `renderTargetChips()` | `annotation-dialog.js` | `<dp-annotation-chip-row>` |
| `_renderSidebarOptions()` | `panel-history.js` | `<dp-sidebar-options>` |
| `_renderTargetRows()` | `panel-history.js` | `<dp-target-row-list>` |
| `_renderComparisonTabs()` | `panel-history.js` | `<dp-comparison-tab-rail>` |
| `_ensureDateWindowDialog()` body | `panel-history.js` | `<dp-date-window-dialog>` |

---

## Verification

After each extracted component:
- `pnpm test` — all GIVEN/WHEN/THEN tests pass
- `pnpm build` — IIFE bundle builds successfully
- `pnpm lint` — no lint errors


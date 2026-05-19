# Anomaly monitor wizard — context

## Purpose

Owns the dialog flow for creating and editing anomaly monitors from the datapoints UI. The wizard is a three-step create flow (entities → analysis → schedule) and a two-step edit flow (analysis → schedule).

## State & data flow

- Step 1 stores raw target-picker state in `_target`, then resolves the effective entity set with `resolveEntityIdsFromTarget(...)` when advancing or when quick-add affordances need to reason about the current selection.
- Step 2 keeps per-entity analysis state in `_entityConfigs`, keyed by entity ID, and projects that slim wizard config back into `NormalizedAnalysis` for the embedded analysis groups.
- Step 3 derives the final monitor payload from `_entityIds`, `_monitorType`, schedule fields, and the active entity config before calling `createMonitor()` or `updateMonitor()`.

## External dependencies

- Home Assistant target resolution through `target-selection` helpers.
- `analysis-sample-group` and `analysis-anomaly-group` for the embedded analysis controls.
- `monitors-api` for create/update persistence.
- `@lit/localize` runtime mode for user-visible strings.

## Non-obvious behaviors

- Quick-add actions intentionally collapse mixed target-picker state into an explicit `entity_id` list. This favors predictability over preserving area/device/label targeting once the user starts adding chart-derived entities.
- `suggestedEntityIds` and `allSeriesEntityIds` are separate on purpose: suggestions exclude the origin series, while the all-series set includes it so clearing step 1 is recoverable.
- Create mode auto-populates the monitor name only when moving from step 2 to step 3 with a blank name; edit mode skips the entities step entirely.

## Conventions

- Keep wizard-only analysis shape in `monitor-wizard-logic.ts`; use the component class for orchestration and event handling rather than embedding more pure logic inline.
- When changing visible copy here, update the co-located `i18n/` locale files in the same directory.

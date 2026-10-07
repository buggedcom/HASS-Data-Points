# ADR 0001 — No `Chart` facade for history-chart; keep the existing lifecycle seam

- **Status:** Accepted
- **Date:** 2026-10-07
- **Issue:** #27 (B of 2) — "Decide/build a Chart lifecycle seam for history-chart, test-first"
- **Depends on:** #17 (history-chart pure extractions, merged), #23 (chart-interaction tidy)

## Context

Issue #27 asked whether a `Chart` facade (`mount` / `draw` / `on(event, handler)` /
`dispose`) is the right abstraction for the charting seam, once #17 had untangled
history-chart's split view. It was deliberately a **decision ticket**: the first
deliverable is a characterization test net pinning current interaction behaviour,
and the second is an explicit go/no-go once the real shape is in hand.

The original premise (in the pre-split #23) was that a single `Chart` class would
unify the chart consumers and give `dispose()` a home. Investigating the live code
against that premise:

1. **Split view is genuinely multi-renderer.** `history-chart` constructs a
   `ChartRenderer` at three distinct sites — the main single-canvas draw
   (`history-chart.ts:474`), the non-split redraw path (`:2875`), and **one per
   split row inside a loop** (`:4737`, `rowCanvas`). Split mode therefore owns _N_
   canvases and _N_ renderers simultaneously. A single-canvas `Chart` holding one
   `ChartRenderer` cannot model this.

2. **`sensor-chart` is not an interaction consumer.** It imports only `setupCanvas`
   and `ChartRenderer` (`sensor-chart.ts:1–12`) and hand-rolls its own tooltip; it
   never touches `chart-interaction`. So it would exercise only `mount`/`draw` of a
   facade and prove nothing about the hard part (hover/zoom/dispose). It is not a
   second consumer that justifies a shared abstraction.

3. **`on(event, handler)` is the wrong shape for per-draw data.** The hover attach
   needs `series / events / t0 / t1 / vMin / vMax / axes` plus ~20 options, and all
   of it changes on every redraw. An event-subscription API cannot carry that;
   either `draw(model)` must re-attach each frame, or the attach call must take the
   data — in which case it simply _is_ the options-object attach that #23 shipped
   (`attachLineChartHover(options)`), not an event bus.

4. **The lifecycle seam already exists and is already honest.** Both modes write
   their teardown into the same two host fields and `disconnectedCallback` invokes
   both:
   - single-canvas: `attachLineChartHover` / `attachLineChartRangeZoom` set
     `_chartHoverCleanup` / `_chartZoomCleanup`;
   - split: `_attachSplitHover` sets the _same_ `_chartHoverCleanup`
     (`history-chart.ts:6283`) and `_chartZoomCleanup` (`:6387`), each removing the
     overlay/window listeners it added;
   - `disconnectedCallback` (`:250`) calls both and nulls them.

   The characterization net added for this ticket
   (`history-chart/__tests__/history-chart-interaction.spec.ts`) drives real
   `mousemove` / `dblclick` / disconnect in **both** modes and asserts the listeners
   stop firing after disconnect. AC3's feared "orphaned cleanup in split mode" does
   **not** exist on current code.

## Decision

**No-go on a `Chart` facade.** We will not add a `Chart` class (or any competing
lifecycle abstraction) beside `ChartCardBase` and the existing
`attach*` + `disconnectedCallback` seam.

The genuinely valuable, consumer-agnostic wins have already been taken in **#23**:

- deleted the dead `charts/utils/chart-interaction.ts` pass-through;
- collapsed `attachLineChartHover`'s 11 positional parameters into a single
  `AttachLineChartHoverOptions` object (this _is_ the right "pass per-draw data"
  shape, and it supersedes the `on(event, handler)` idea);
- made `ChartInteractionHost` an explicit interface and removed the monkey-patch
  cast in `getInteractionState`.

What remains of #27 is captured as the **characterization net** (AC1), which is
valuable regardless of this decision: it is the regression harness that any future
refactor of the interaction layer must keep green.

## Rationale

- A facade would have to be multi-renderer to fit split view, at which point it is
  not the "single canvas + one renderer + `on()`" facade that was proposed — it is a
  reinvention of what `history-chart` already coordinates.
- The only other candidate consumer (`sensor-chart`) does not use the interaction
  layer, so there is no second caller to amortise a shared abstraction against.
- The lifecycle concern that motivated the facade (honest `dispose`) is already met
  by `disconnectedCallback` routing through the shared `_chart*Cleanup` fields, now
  pinned by tests.
- Adding a second abstraction beside `ChartCardBase` (which owns the
  `ResizeObserver`/redraw lifecycle for `history.ts`, while `sensor.ts` extends
  `LitElement` directly) would _increase_ the lifecycle inconsistency the ticket
  flagged, not reduce it.

## Consequences

- The interaction layer keeps its current shape: free functions in
  `lib/chart/chart-interaction.ts` that take the host + per-draw data and register
  teardown on the host, torn down centrally in `disconnectedCallback`.
- The new characterization spec is now the contract for that behaviour; changes to
  hover/crosshair/tooltip/zoom or to disconnect teardown must keep it green.
- No new public API, no migration, no bundle surface added.

## When to revisit

Reopen the facade question only if a **third** chart consumer appears that needs the
full hover/zoom/dispose stack, or if split view is ever reduced to a single
renderer. Until then, the unifying abstraction would cost more than it saves.

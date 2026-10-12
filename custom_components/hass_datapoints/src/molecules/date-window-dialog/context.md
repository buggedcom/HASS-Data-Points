# Date Window Dialog — context

## Purpose

Renders the Add / Edit "date window" dialog opened from the comparison-tab rail
(the **+** affordance) and from the anomaly flow. A date window is a named date
range saved as a comparison tab. The molecule wraps `ha-dialog` and presents the
name field, a start/end datetime pair, a range timeline, optional range
shortcuts, and the action row (Create/Save, Cancel, and Delete when editing).

## Ownership model

The dialog owns **two** pieces of state that used to leak to the panel, which
is what collapses the feature to a single test seam:

- **Name.** The incoming `name` property is only a _seed_. On the `open`
  false→true transition (`willUpdate`, guarded by `_wasOpen`) it is copied into
  the internal `_nameValue` `@state`; thereafter the user's typed value is
  authoritative. Binding `.value` directly to the reactive `name` prop on every
  render was the original wipe bug — a parent re-render (e.g. from a date change
  updating the controlled start/end values) re-applied the stale `name` and
  erased what the user typed.
- **Validation.** On submit the dialog validates a non-empty trimmed name and a
  parseable start strictly before a parseable end. Invalid submits call the
  internal `shake()` (reusing the `dp-dialog-shake` animation), set `_error`
  (`"name"` | `"range"`) which renders a localized inline message keyed to the
  offending field, and do **not** emit `dp-window-submit`. The error clears as
  soon as the offending field is corrected (name typed, or range made valid via
  a date input / timeline commit). Only a valid submit emits
  `dp-window-submit` with `{ name, start, end }`.

Everything else — the draft range, start/end values, range bounds, zoom level
and date snapping — stays **controlled by the panel** and is passed down as
properties. The dialog forwards date edits and timeline commits up via
`dp-window-date-change` so the panel can keep the draft range in step.

## Panel relationship (`panels/datapoints/datapoints.ts`)

- `_openDateWindowDialog` seeds `.name` (from the edited window's label, or "")
  and flips `_dateWindowDialogOpen`; the dialog seeds its internal name from that.
- `_createDateWindowFromDialog` treats `dp-window-submit` as already-valid. Its
  `if (!label || !start || !end || start >= end) return;` check is now a
  **defensive assertion** against a malformed event, not the primary validation
  path, and intentionally provides no user feedback (the dialog owns that).
- The panel still handles `dp-window-close`, `dp-window-delete`,
  `dp-window-shortcut` and `dp-window-date-change`, and no longer needs to call
  `shake()` or feed a controlled name value back into the dialog.

## Events (unchanged shapes)

`dp-window-close {}`, `dp-window-submit { name, start, end }` (now guaranteed
valid), `dp-window-delete {}`, `dp-window-shortcut { direction: -1 | 1 }`,
`dp-window-date-change { start, end }`.

## Non-obvious behaviors

- Delete is unaffected by validation — it fires `dp-window-delete` regardless of
  the current name/range so an existing window can always be removed.
- The start/end controls use native `<input type="datetime-local">`; the name
  uses `ha-textfield`. The submit path reads the name from the live input,
  falling back to `_nameValue`, so an uncommitted keystroke is still captured.
- Per ADR 0001 (no chart facade), the dialog drives everything through its
  public property/event seam and the panel's public handlers; it does not reach
  into chart internals.
- LIT 3 conventions: `accessor` on every `@property`/`@state`,
  `customElements.define` at the bottom, styles in `date-window-dialog.styles.ts`,
  and derived values computed in `willUpdate` rather than held as `@state`.

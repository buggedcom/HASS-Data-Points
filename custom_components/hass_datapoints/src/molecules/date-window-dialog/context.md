# Date Window Dialog — context

## Purpose

Renders the Add / Edit "date window" dialog opened from the comparison-tab rail
(the **+** affordance) and from the anomaly flow. A date window is a named date
range saved as a comparison tab. The molecule wraps `ha-dialog` and presents,
top to bottom: a **Relative | Fixed dates** tab bar (Relative first), one line
explaining the chosen type, that type's fields, the optional name, and the
action row (Create/Save, Cancel, and Delete when editing). There is no timeline
slider.

## Ownership model

- **Name.** The incoming `name` property is only a _seed_. On the `open`
  false→true transition (`willUpdate`, guarded by `_wasOpen`) it is copied into
  the internal `_nameValue` `@state`; thereafter the user's typed value is
  authoritative. Binding `.value` directly to the reactive `name` prop on every
  render was the original wipe bug. The name is **optional**: left empty, it
  defaults to `_defaultName` (the preset label, or the fixed dates via
  `formatDateTimeRange`), shown as the field's placeholder and used on submit.
  A relative window whose stored name equals its preset label opens with an
  empty field, so its name keeps following the preset.
- **Validation.** Only the fixed range is validated: both dates must parse and
  start must be strictly before end. While it is invalid, Create is disabled,
  the inputs are `aria-invalid` and "End must be after start." replaces the
  length line. A forced submit still calls `shake()` and does not emit.
- **Fixed dates.** `_fixedStart` / `_fixedEnd` mirror the controlled
  `startValue` / `endValue` and the user's own edits, so validity, the length
  line and the default name update as they type. The dialog forwards edits via
  `dp-window-date-change` so the panel keeps its draft range in step.

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

## Relative windows

A window is either **fixed** (start/end dates) or **relative**: a preset from
`lib/domain/relative-date-window.ts` ("Previous period", "Same period last
year", …) resolved against the chart's selected range, always lasting as long
as that range. The dialog owns two more pieces of seeded state, on the same
open-edge pattern as the name:

- `_kindValue` is seeded from `kind`, and forced to fixed when `allowRelative` is
  false. The panel sets `allowRelative` to false when the dialog was opened to
  create an anomaly comparison window, because anomalies only use fixed windows.
- `_presetValue` is seeded from `preset`, defaulting to `previous_period`.

The Relative tab shows a native preset `<select>` and a preview of the
selected range against the window it resolves to (computed from `rangeStart` /
`rangeEnd` / `now`), a strip showing where the window sits, and the shared
length. The Fixed dates tab shows start/end, the length, and (when
`showShortcuts`) "Fill from" chips: Selected range (filled locally from
`rangeStart` / `rangeEnd`), Previous range and Next range (`dp-window-shortcut`).
Switching relative → fixed emits `dp-window-date-change` with the resolved
dates, so the panel's draft range starts there. The tabs follow the ARIA tab
pattern, with arrow keys moving between them.

## Events

`dp-window-close {}`, `dp-window-submit` (guaranteed valid) as
`{ kind: "fixed", name, start, end }` or `{ kind: "relative", name, preset }`, `dp-window-delete {}`, `dp-window-shortcut { direction: -1 | 1 }`,
`dp-window-date-change { start, end }`.

## Non-obvious behaviors

- Delete is unaffected by validation — it fires `dp-window-delete` regardless of
  the current name/range so an existing window can always be removed.
- The start/end controls use native `<input type="datetime-local">` and the
  name uses a native `<input type="text">` with the same styling. It used to be
  `ha-textfield`, but that element is lazy-loaded by HA and is not guaranteed to
  be defined on the datapoints panel, so it rendered as an empty, invisible tag
  and the name could never be entered. Enter in the name field submits. The submit path reads the name from the live input,
  falling back to `_nameValue`, so an uncommitted keystroke is still captured.
- Per ADR 0001 (no chart facade), the dialog drives everything through its
  public property/event seam and the panel's public handlers; it does not reach
  into chart internals.
- LIT 3 conventions: `accessor` on every `@property`/`@state`,
  `customElements.define` at the bottom, styles in `date-window-dialog.styles.ts`,
  and derived values computed in `willUpdate` rather than held as `@state`.

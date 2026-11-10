import { html } from "lit";
import { expect, fn, userEvent, within } from "@storybook/test";
import { setFrontendLocale } from "@/lib/i18n/localize";
import "../date-window-dialog";

/**
 * `date-window-dialog` renders the Add / Edit date window dialog.
 * It wraps `ha-dialog` and provides a form for setting a named date range.
 *
 * A Relative | Fixed dates tab bar sits at the top, Relative first. A
 * relative window is a preset ("Previous period", "Same period last year", …)
 * resolved against the selected range; a fixed window pins exact dates. The
 * name is optional and defaults to the preset label or the dates. Create is
 * disabled while the fixed range is invalid.
 *
 * @fires dp-window-close - `{}` fired when Cancel is clicked or the dialog is dismissed
 * @fires dp-window-submit - `{ kind: "fixed", name, start, end }` or `{ kind: "relative", name, preset }`, fired only on a valid submit
 * @fires dp-window-delete - `{}` fired when the Delete button is clicked
 * @fires dp-window-shortcut - `{ direction: -1 | 1 }` fired when the Previous / Next range fill chip is clicked
 * @fires dp-window-date-change - `{ start: string, end: string }` fired when a date input changes
 */
export default {
  title: "Molecules/Date Window Dialog",
  component: "date-window-dialog",
  loaders: [
    async () => {
      await setFrontendLocale("en");
      return {};
    },
  ],
  parameters: {
    actions: {
      handles: [
        "dp-window-close",
        "dp-window-submit",
        "dp-window-delete",
        "dp-window-shortcut",
        "dp-window-date-change",
      ],
    },
  },
  argTypes: {
    open: {
      control: "boolean",
      description: "Whether the dialog is open.",
    },
    heading: {
      control: "text",
      description: "Title shown in the dialog header.",
    },
    name: {
      control: "text",
      description: "Current value of the name text field.",
    },
    startValue: {
      control: "text",
      description: "Current value of the start datetime-local input.",
    },
    endValue: {
      control: "text",
      description: "Current value of the end datetime-local input.",
    },
    showDelete: {
      control: "boolean",
      description:
        "Whether the Delete button is shown (true when editing an existing window).",
    },
    showShortcuts: {
      control: "boolean",
      description:
        "Whether the 'Fill from' chips are shown on the Fixed dates tab.",
    },
    submitLabel: {
      control: "text",
      description:
        'Label for the submit button. E.g. "Create date window" or "Save date window".',
    },
    kind: {
      control: "select",
      options: ["fixed", "relative"],
      description: "Seed for the window type, applied when the dialog opens.",
    },
    preset: {
      control: "text",
      description:
        "Seed for the relative preset, applied when the dialog opens.",
    },
    allowRelative: {
      control: "boolean",
      description: "Whether the Relative / Fixed dates tabs are offered.",
    },
  },
  args: {
    open: true,
    heading: "Add date window",
    name: "",
    startValue: "",
    endValue: "",
    showDelete: false,
    showShortcuts: false,
    submitLabel: "Create date window",
    kind: "fixed",
    preset: null,
    allowRelative: true,
    rangeStart: new Date(2026, 10, 3),
    rangeEnd: new Date(2026, 10, 10),
    now: new Date(2026, 10, 10),
  },
  render: (args: RecordWithUnknownValues) => html`
    <date-window-dialog
      .open=${args.open}
      .heading=${args.heading}
      .name=${args.name}
      .startValue=${args.startValue}
      .endValue=${args.endValue}
      .showDelete=${args.showDelete}
      .showShortcuts=${args.showShortcuts}
      .submitLabel=${args.submitLabel}
      .kind=${args.kind}
      .preset=${args.preset}
      .allowRelative=${args.allowRelative}
      .rangeStart=${args.rangeStart}
      .rangeEnd=${args.rangeEnd}
      .now=${args.now}
    ></date-window-dialog>
  `,
};

/** Add mode — opens on the Relative tab with "Previous period". */
export const AddMode = {
  args: {
    heading: "Add date window",
    kind: "relative",
    startValue: "2025-01-01T00:00",
    endValue: "2025-01-07T00:00",
    showShortcuts: true,
    submitLabel: "Create date window",
  },
};

/** Add mode on the Fixed dates tab — start/end, length and fill chips. */
export const AddModeFixed = {
  args: {
    heading: "Add date window",
    startValue: "2026-10-27T00:00",
    endValue: "2026-11-03T00:00",
    showShortcuts: true,
    submitLabel: "Create date window",
  },
};

/** Edit mode — pre-filled name, delete button shown, no fill chips. */
export const EditMode = {
  args: {
    heading: "Edit date window",
    name: "Heating season",
    startValue: "2024-11-01T00:00",
    endValue: "2025-03-31T00:00",
    showDelete: true,
    showShortcuts: false,
    submitLabel: "Save date window",
  },
};

/** Dialog closed — open=false, dialog is not visible. */
export const Closed = {
  args: { open: false },
};

/** Fires dp-window-submit when the submit button is clicked. */
export const EmitsSubmit = {
  args: {
    name: "Test window",
    startValue: "2025-01-01T00:00",
    endValue: "2025-01-07T00:00",
    submitLabel: "Create date window",
  },
  play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    const host = canvasElement.querySelector(
      "date-window-dialog"
    ) as HTMLElement;
    const handler = fn();
    host.addEventListener("dp-window-submit", handler);
    const canvas = within(host.shadowRoot as unknown as HTMLElement);
    await userEvent.click(canvas.getByText("Create date window"));
    await expect(handler).toHaveBeenCalledOnce();
    const detail = (handler.mock.calls[0][0] as CustomEvent).detail as {
      name: string;
      start: string;
      end: string;
    };
    await expect(detail).toHaveProperty("name");
    await expect(detail).toHaveProperty("start");
    await expect(detail).toHaveProperty("end");
  },
};

/**
 * Invalid range — the end is before the start, so Create is disabled, an
 * inline error is shown and clicking Create does not emit dp-window-submit.
 */
export const InvalidRangeShowsError = {
  args: {
    name: "",
    startValue: "2025-01-07T00:00",
    endValue: "2025-01-01T00:00",
    submitLabel: "Create date window",
  },
  play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    const host = canvasElement.querySelector(
      "date-window-dialog"
    ) as HTMLElement;
    const handler = fn();
    host.addEventListener("dp-window-submit", handler);
    await expect(
      host.shadowRoot!.querySelector(".date-window-dialog-error")
    ).not.toBeNull();
    host
      .shadowRoot!.querySelector<HTMLElement>(".date-window-dialog-submit")!
      .click();
    await expect(handler).not.toHaveBeenCalled();
  },
};

/** Fires dp-window-delete when the delete button is clicked in edit mode. */
export const EmitsDelete = {
  args: {
    heading: "Edit date window",
    name: "Heating season",
    startValue: "2024-11-01T00:00",
    endValue: "2025-03-31T00:00",
    showDelete: true,
    submitLabel: "Save date window",
  },
  play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    const host = canvasElement.querySelector(
      "date-window-dialog"
    ) as HTMLElement;
    const handler = fn();
    host.addEventListener("dp-window-delete", handler);
    const canvas = within(host.shadowRoot as unknown as HTMLElement);
    await userEvent.click(canvas.getByText("Delete date window"));
    await expect(handler).toHaveBeenCalledOnce();
  },
};

/** Relative mode — preset select and a live preview of the resolved dates. */
export const RelativeMode = {
  args: {
    heading: "Edit date window",
    name: "Same period last year",
    kind: "relative",
    preset: "year_back_1",
    showDelete: true,
    submitLabel: "Save date window",
  },
  play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    const host = canvasElement.querySelector(
      "date-window-dialog"
    ) as HTMLElement;
    const handler = fn();
    host.addEventListener("dp-window-submit", handler);
    const canvas = within(host.shadowRoot as unknown as HTMLElement);
    await expect(canvas.getByText("This window")).toBeTruthy();
    await userEvent.click(canvas.getByText("Save date window"));
    await expect(handler).toHaveBeenCalledOnce();
    await expect((handler.mock.calls[0][0] as CustomEvent).detail).toEqual({
      kind: "relative",
      name: "Same period last year",
      preset: "year_back_1",
    });
  },
};

/** Relative, unavailable preset — "Next period" while the chart ends now. */
export const RelativeUnavailablePreset = {
  args: {
    kind: "relative",
    preset: "next_period",
  },
  play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    const host = canvasElement.querySelector(
      "date-window-dialog"
    ) as HTMLElement;
    await expect(
      host.shadowRoot!.querySelector(".date-window-dialog-preview-note")
        ?.textContent
    ).toContain("No data yet");
  },
};

import { html } from "lit";
import { expect, fn, userEvent, within } from "@storybook/test";
import { setFrontendLocale } from "@/lib/i18n/localize";
import "../date-window-dialog";

/**
 * `date-window-dialog` renders the Add / Edit date window dialog.
 * It wraps `ha-dialog` and provides a form for setting a named date range.
 *
 * The dialog owns its name state and validation: the `name` prop seeds the
 * field on open, start/end values stay parent-controlled, and submit only
 * fires when the inputs are valid (otherwise the dialog shakes and shows an
 * inline error).
 *
 * @fires dp-window-close - `{}` fired when Cancel is clicked or the dialog is dismissed
 * In relative mode the window is a preset ("Previous period", "Same period
 * last year", …) resolved against the selected range instead of fixed dates.
 *
 * @fires dp-window-submit - `{ kind: "fixed", name, start, end }` or `{ kind: "relative", name, preset }`, fired only on a valid submit
 * @fires dp-window-delete - `{}` fired when the Delete button is clicked
 * @fires dp-window-shortcut - `{ direction: -1 | 1 }` fired when a shortcut button is clicked
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
        "Whether the 'Use previous/next range' shortcut buttons are shown.",
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
      description: "Whether the fixed / relative type toggle is offered.",
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

/** Add mode — empty name field, no delete button, shortcut buttons visible. */
export const AddMode = {
  args: {
    heading: "Add date window",
    startValue: "2025-01-01T00:00",
    endValue: "2025-01-07T00:00",
    showShortcuts: true,
    submitLabel: "Create date window",
  },
};

/** Edit mode — pre-filled name, delete button shown, no shortcuts. */
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
 * Invalid submit — clicking Create with an empty name does not emit
 * dp-window-submit; the dialog shakes and shows an inline error instead.
 */
export const InvalidSubmitShowsError = {
  args: {
    name: "",
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
    await expect(handler).not.toHaveBeenCalled();
    await expect(
      host.shadowRoot!.querySelector(".date-window-dialog-error")
    ).not.toBeNull();
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
    await expect(canvas.getByText(/Currently/)).toBeTruthy();
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
    name: "Next period",
    kind: "relative",
    preset: "next_period",
  },
  play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    const host = canvasElement.querySelector(
      "date-window-dialog"
    ) as HTMLElement;
    await expect(
      host.shadowRoot!.querySelector(".date-window-dialog-preview-note")
    ).not.toBeNull();
  },
};

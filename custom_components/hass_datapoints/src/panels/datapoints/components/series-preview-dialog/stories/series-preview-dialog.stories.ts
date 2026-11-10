import { html } from "lit";
import "../series-preview-dialog";

const meta = {
  title: "Panels/Datapoints/SeriesPreviewDialog",
  component: "series-preview-dialog",
};

export default meta;

export const Default = {
  render: () => html`
    <series-preview-dialog
      .open=${true}
      .heading=${"Kitchen temperature anomalies"}
      .subheading=${"Jan 6, 2025, 12:00 AM – Jan 7, 2025, 12:00 AM"}
      .chartConfig=${{ entities: ["sensor.kitchen_temperature"] }}
    ></series-preview-dialog>
  `,
};

export const WithoutOpenInChart = {
  render: () => html`
    <series-preview-dialog
      .open=${true}
      .heading=${"Kitchen temperature anomalies"}
      .showOpenChart=${false}
      .chartConfig=${{ entities: ["sensor.kitchen_temperature"] }}
    ></series-preview-dialog>
  `,
};

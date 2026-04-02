import { html } from "lit";
import "../dp-chart-message";

export default {
  title: "Atoms/Display/Chart Message",
  component: "dp-chart-message",
  argTypes: {
    message: { control: "text" },
  },
};

export const Hidden = {
  render: () => html`
    <div style="position: relative; height: 200px; background: #1c1c1c;">
      <dp-chart-message></dp-chart-message>
    </div>
  `,
};

export const WithMessage = {
  render: () => html`
    <div style="position: relative; height: 200px; background: #1c1c1c;">
      <dp-chart-message .message=${"No data available for this period"}></dp-chart-message>
    </div>
  `,
};

export const ErrorMessage = {
  render: () => html`
    <div style="position: relative; height: 200px; background: #1c1c1c;">
      <dp-chart-message .message=${"Failed to load history data"}></dp-chart-message>
    </div>
  `,
};

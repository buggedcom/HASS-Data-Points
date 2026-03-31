import { html } from "lit";
import "./dp-chart-legend";

export default {
  title: "Molecules/Chart Legend",
  component: "dp-chart-legend",
};

export const TwoSeries = {
  render: () => html`
    <dp-chart-legend
      .series=${[
        { entityId: "sensor.temp", label: "Temperature", color: "#2196f3", unit: "°C" },
        { entityId: "sensor.hum", label: "Humidity", color: "#4caf50", unit: "%" },
      ]}
      .hiddenSeries=${new Set()}
    ></dp-chart-legend>
  `,
};

export const WithHidden = {
  render: () => html`
    <dp-chart-legend
      .series=${[
        { entityId: "sensor.temp", label: "Temperature", color: "#2196f3", unit: "°C" },
        { entityId: "sensor.hum", label: "Humidity", color: "#4caf50", unit: "%" },
        { entityId: "sensor.pressure", label: "Pressure", color: "#ff9800", unit: "hPa" },
      ]}
      .hiddenSeries=${new Set(["sensor.hum"])}
    ></dp-chart-legend>
  `,
};

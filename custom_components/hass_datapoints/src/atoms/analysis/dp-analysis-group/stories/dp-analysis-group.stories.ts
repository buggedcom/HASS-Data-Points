import { html } from "lit";
import "../dp-analysis-group";

export default {
  title: "Atoms/Analysis/Analysis Group",
  component: "dp-analysis-group",
  parameters: {
    actions: {
      handles: ["dp-group-change"],
    },
  },
};

export const Unchecked = {
  render: () => html`
    <dp-analysis-group .label=${"Show trend lines"} .checked=${false}></dp-analysis-group>
  `,
};

export const Checked = {
  render: () => html`
    <dp-analysis-group .label=${"Show trend lines"} .checked=${true}>
      <div>Body content visible when checked</div>
    </dp-analysis-group>
  `,
};

export const Disabled = {
  render: () => html`
    <dp-analysis-group .label=${"Delta analysis (requires date window)"} .checked=${false} .disabled=${true}></dp-analysis-group>
  `,
};

export const AlignTop = {
  render: () => html`
    <dp-analysis-group .label=${"Show delta vs selected date window"} .checked=${false} .alignTop=${true}>
      <span slot="hint"><br /><span style="color: var(--secondary-text-color); font-size: 0.8em;">Select a date window tab to enable delta analysis.</span></span>
    </dp-analysis-group>
  `,
};

export const CheckedWithBody = {
  render: () => html`
    <dp-analysis-group .label=${"Show anomalies"} .checked=${true}>
      <label style="display:flex;align-items:center;gap:6px;">
        <input type="checkbox" checked> Sub-option one
      </label>
      <label style="display:flex;align-items:center;gap:6px;">
        <input type="checkbox"> Sub-option two
      </label>
    </dp-analysis-group>
  `,
};

import{b as e}from"./iframe-maWesKjk.js";import"./analysis-group-ZyfAZWsO.js";import"./preload-helper-PPVm8Dsz.js";import"./property-DyW-YDBW.js";const d={title:"Atoms/Analysis/Analysis Group",component:"analysis-group",parameters:{actions:{handles:["dp-group-change"]}}},a={render:()=>e`
    <analysis-group
      .label=${"Show trend lines"}
      .checked=${!1}
    ></analysis-group>
  `},s={render:()=>e`
    <analysis-group .label=${"Show trend lines"} .checked=${!0}>
      <div>Body content visible when checked</div>
    </analysis-group>
  `},n={render:()=>e`
    <analysis-group
      .label=${"Delta analysis (requires date window)"}
      .checked=${!1}
      .disabled=${!0}
    ></analysis-group>
  `},r={render:()=>e`
    <analysis-group
      .label=${"Show delta vs selected date window"}
      .checked=${!1}
      .alignTop=${!0}
    >
      <span slot="hint"
        ><br /><span
          style="color: var(--secondary-text-color); font-size: 0.8em;"
          >Select a date window tab to enable delta analysis.</span
        ></span
      >
    </analysis-group>
  `},o={render:()=>e`
    <analysis-group .label=${"Show anomalies"} .checked=${!0}>
      <label style="display:flex;align-items:center;gap:6px;">
        <input type="checkbox" checked /> Sub-option one
      </label>
      <label style="display:flex;align-items:center;gap:6px;">
        <input type="checkbox" /> Sub-option two
      </label>
    </analysis-group>
  `};a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  render: () => html\`
    <analysis-group
      .label=\${"Show trend lines"}
      .checked=\${false}
    ></analysis-group>
  \`
}`,...a.parameters?.docs?.source}}};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  render: () => html\`
    <analysis-group .label=\${"Show trend lines"} .checked=\${true}>
      <div>Body content visible when checked</div>
    </analysis-group>
  \`
}`,...s.parameters?.docs?.source}}};n.parameters={...n.parameters,docs:{...n.parameters?.docs,source:{originalSource:`{
  render: () => html\`
    <analysis-group
      .label=\${"Delta analysis (requires date window)"}
      .checked=\${false}
      .disabled=\${true}
    ></analysis-group>
  \`
}`,...n.parameters?.docs?.source}}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
  render: () => html\`
    <analysis-group
      .label=\${"Show delta vs selected date window"}
      .checked=\${false}
      .alignTop=\${true}
    >
      <span slot="hint"
        ><br /><span
          style="color: var(--secondary-text-color); font-size: 0.8em;"
          >Select a date window tab to enable delta analysis.</span
        ></span
      >
    </analysis-group>
  \`
}`,...r.parameters?.docs?.source}}};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  render: () => html\`
    <analysis-group .label=\${"Show anomalies"} .checked=\${true}>
      <label style="display:flex;align-items:center;gap:6px;">
        <input type="checkbox" checked /> Sub-option one
      </label>
      <label style="display:flex;align-items:center;gap:6px;">
        <input type="checkbox" /> Sub-option two
      </label>
    </analysis-group>
  \`
}`,...o.parameters?.docs?.source}}};const p=["Unchecked","Checked","Disabled","AlignTop","CheckedWithBody"];export{r as AlignTop,s as Checked,o as CheckedWithBody,n as Disabled,a as Unchecked,p as __namedExportsOrder,d as default};

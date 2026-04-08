import{b as r}from"./iframe-maWesKjk.js";import"./date-time-input-Ct788ihS.js";import"./preload-helper-PPVm8Dsz.js";import"./property-DyW-YDBW.js";const s={title:"Atoms/Form/Date Time Input",component:"date-time-input",parameters:{actions:{handles:["dp-datetime-change"]}}},e={render:()=>r`
    <date-time-input
      .label=${"Start time"}
      .value=${"2024-06-01T12:00"}
    ></date-time-input>
  `},t={render:()=>r`
    <date-time-input .value=${"2024-06-01T09:30"}></date-time-input>
  `},a={render:()=>r`
    <date-time-input .label=${"End time"}></date-time-input>
  `};e.parameters={...e.parameters,docs:{...e.parameters?.docs,source:{originalSource:`{
  render: () => html\`
    <date-time-input
      .label=\${"Start time"}
      .value=\${"2024-06-01T12:00"}
    ></date-time-input>
  \`
}`,...e.parameters?.docs?.source}}};t.parameters={...t.parameters,docs:{...t.parameters?.docs,source:{originalSource:`{
  render: () => html\`
    <date-time-input .value=\${"2024-06-01T09:30"}></date-time-input>
  \`
}`,...t.parameters?.docs?.source}}};a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  render: () => html\`
    <date-time-input .label=\${"End time"}></date-time-input>
  \`
}`,...a.parameters?.docs?.source}}};const p=["Default","WithoutLabel","Empty"];export{e as Default,a as Empty,t as WithoutLabel,p as __namedExportsOrder,s as default};

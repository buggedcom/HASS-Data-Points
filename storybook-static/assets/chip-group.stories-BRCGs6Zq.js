import{b as o}from"./iframe-maWesKjk.js";import"./chip-group-CRK0J3ni.js";import{c as i}from"./mock-hass-fqpCrfSc.js";import"./preload-helper-PPVm8Dsz.js";import"./property-DyW-YDBW.js";import"./entity-chip-B-eFJyDu.js";const d={title:"Molecules/Chip Group",component:"chip-group",parameters:{actions:{handles:["dp-chips-change"]}}},a=i(),p=[{type:"entity_id",id:"sensor.temperature"},{type:"entity_id",id:"sensor.humidity"}],e={render:()=>o`
    <chip-group .items=${p} .hass=${a}></chip-group>
  `},s={render:()=>o`
    <chip-group
      .items=${p}
      .hass=${a}
      .label=${"Linked entities"}
    ></chip-group>
  `},r={render:()=>o`
    <chip-group
      .items=${p}
      .hass=${a}
      .removable=${!0}
      .label=${"Linked entities"}
    ></chip-group>
  `},t={render:()=>o`
    <chip-group
      .items=${[]}
      .hass=${a}
      .label=${"Linked entities"}
    ></chip-group>
  `};e.parameters={...e.parameters,docs:{...e.parameters?.docs,source:{originalSource:"{\n  render: () => html`\n    <chip-group .items=${sampleItems} .hass=${mockHass}></chip-group>\n  `\n}",...e.parameters?.docs?.source}}};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  render: () => html\`
    <chip-group
      .items=\${sampleItems}
      .hass=\${mockHass}
      .label=\${"Linked entities"}
    ></chip-group>
  \`
}`,...s.parameters?.docs?.source}}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
  render: () => html\`
    <chip-group
      .items=\${sampleItems}
      .hass=\${mockHass}
      .removable=\${true}
      .label=\${"Linked entities"}
    ></chip-group>
  \`
}`,...r.parameters?.docs?.source}}};t.parameters={...t.parameters,docs:{...t.parameters?.docs,source:{originalSource:`{
  render: () => html\`
    <chip-group
      .items=\${[]}
      .hass=\${mockHass}
      .label=\${"Linked entities"}
    ></chip-group>
  \`
}`,...t.parameters?.docs?.source}}};const $=["Default","WithLabel","Removable","Empty"];export{e as Default,t as Empty,r as Removable,s as WithLabel,$ as __namedExportsOrder,d as default};

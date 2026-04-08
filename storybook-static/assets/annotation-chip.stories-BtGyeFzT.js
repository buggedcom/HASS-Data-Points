import{b as o}from"./iframe-maWesKjk.js";import"./annotation-chip-BpF_qtuH.js";import"./preload-helper-PPVm8Dsz.js";import"./property-DyW-YDBW.js";const c={title:"Atoms/Interactive/Annotation Chip",component:"annotation-chip"},e={render:()=>o`
    <annotation-chip
      .type=${"entity"}
      .itemId=${"sensor.temperature"}
      .icon=${"mdi:thermometer"}
      .name=${"Temperature"}
    ></annotation-chip>
  `},n={render:()=>o`
    <annotation-chip
      .type=${"area"}
      .itemId=${"living_room"}
      .icon=${"mdi:sofa"}
      .name=${"Living Room"}
    ></annotation-chip>
  `},t={render:()=>o`
    <annotation-chip
      .type=${"device"}
      .itemId=${"hue_bridge"}
      .icon=${"mdi:bridge"}
      .name=${"Hue Bridge"}
    ></annotation-chip>
  `};e.parameters={...e.parameters,docs:{...e.parameters?.docs,source:{originalSource:`{
  render: () => html\`
    <annotation-chip
      .type=\${"entity"}
      .itemId=\${"sensor.temperature"}
      .icon=\${"mdi:thermometer"}
      .name=\${"Temperature"}
    ></annotation-chip>
  \`
}`,...e.parameters?.docs?.source}}};n.parameters={...n.parameters,docs:{...n.parameters?.docs,source:{originalSource:`{
  render: () => html\`
    <annotation-chip
      .type=\${"area"}
      .itemId=\${"living_room"}
      .icon=\${"mdi:sofa"}
      .name=\${"Living Room"}
    ></annotation-chip>
  \`
}`,...n.parameters?.docs?.source}}};t.parameters={...t.parameters,docs:{...t.parameters?.docs,source:{originalSource:`{
  render: () => html\`
    <annotation-chip
      .type=\${"device"}
      .itemId=\${"hue_bridge"}
      .icon=\${"mdi:bridge"}
      .name=\${"Hue Bridge"}
    ></annotation-chip>
  \`
}`,...t.parameters?.docs?.source}}};const p=["Entity","Area","Device"];export{n as Area,t as Device,e as Entity,p as __namedExportsOrder,c as default};

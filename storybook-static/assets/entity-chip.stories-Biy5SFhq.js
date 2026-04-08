import{b as i}from"./iframe-maWesKjk.js";import"./entity-chip-B-eFJyDu.js";import"./preload-helper-PPVm8Dsz.js";import"./property-DyW-YDBW.js";const m={title:"Atoms/Form/Entity Chip",component:"entity-chip",parameters:{actions:{handles:["dp-chip-remove"]}}},e={render:()=>i`
    <entity-chip
      .type=${"entity"}
      .itemId=${"sensor.living_room_temperature"}
    ></entity-chip>
  `},t={render:()=>i`
    <entity-chip
      .type=${"entity"}
      .itemId=${"sensor.living_room_temperature"}
      .removable=${!0}
    ></entity-chip>
  `},r={render:()=>i`
    <entity-chip
      .type=${"device"}
      .itemId=${"abc123def456"}
      .removable=${!0}
    ></entity-chip>
  `},n={render:()=>i`
    <entity-chip
      .type=${"area"}
      .itemId=${"living_room"}
      .removable=${!0}
    ></entity-chip>
  `};e.parameters={...e.parameters,docs:{...e.parameters?.docs,source:{originalSource:`{
  render: () => html\`
    <entity-chip
      .type=\${"entity"}
      .itemId=\${"sensor.living_room_temperature"}
    ></entity-chip>
  \`
}`,...e.parameters?.docs?.source}}};t.parameters={...t.parameters,docs:{...t.parameters?.docs,source:{originalSource:`{
  render: () => html\`
    <entity-chip
      .type=\${"entity"}
      .itemId=\${"sensor.living_room_temperature"}
      .removable=\${true}
    ></entity-chip>
  \`
}`,...t.parameters?.docs?.source}}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
  render: () => html\`
    <entity-chip
      .type=\${"device"}
      .itemId=\${"abc123def456"}
      .removable=\${true}
    ></entity-chip>
  \`
}`,...r.parameters?.docs?.source}}};n.parameters={...n.parameters,docs:{...n.parameters?.docs,source:{originalSource:`{
  render: () => html\`
    <entity-chip
      .type=\${"area"}
      .itemId=\${"living_room"}
      .removable=\${true}
    ></entity-chip>
  \`
}`,...n.parameters?.docs?.source}}};const c=["Default","Removable","DeviceType","AreaType"];export{n as AreaType,e as Default,r as DeviceType,t as Removable,c as __namedExportsOrder,m as default};

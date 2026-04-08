import{b as o}from"./iframe-maWesKjk.js";import"./legend-item-Df59h7I1.js";import"./preload-helper-PPVm8Dsz.js";import"./property-DyW-YDBW.js";const l={title:"Atoms/Interactive/Legend Item",component:"legend-item"},e={render:()=>o`
    <legend-item
      .label=${"Temperature"}
      .color=${"#2196f3"}
      .unit=${"°C"}
      .pressed=${!0}
    ></legend-item>
  `},r={render:()=>o`
    <legend-item
      .label=${"Humidity"}
      .color=${"#4caf50"}
      .unit=${"%"}
      .pressed=${!1}
    ></legend-item>
  `},n={render:()=>o`
    <legend-item
      .label=${"Motion"}
      .color=${"#ff9800"}
      .pressed=${!0}
    ></legend-item>
  `},t={render:()=>o`
    <legend-item
      .label=${"Binary State"}
      .color=${"#e91e63"}
      .pressed=${!0}
      .opacity=${.35}
    ></legend-item>
  `};e.parameters={...e.parameters,docs:{...e.parameters?.docs,source:{originalSource:`{
  render: () => html\`
    <legend-item
      .label=\${"Temperature"}
      .color=\${"#2196f3"}
      .unit=\${"°C"}
      .pressed=\${true}
    ></legend-item>
  \`
}`,...e.parameters?.docs?.source}}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
  render: () => html\`
    <legend-item
      .label=\${"Humidity"}
      .color=\${"#4caf50"}
      .unit=\${"%"}
      .pressed=\${false}
    ></legend-item>
  \`
}`,...r.parameters?.docs?.source}}};n.parameters={...n.parameters,docs:{...n.parameters?.docs,source:{originalSource:`{
  render: () => html\`
    <legend-item
      .label=\${"Motion"}
      .color=\${"#ff9800"}
      .pressed=\${true}
    ></legend-item>
  \`
}`,...n.parameters?.docs?.source}}};t.parameters={...t.parameters,docs:{...t.parameters?.docs,source:{originalSource:`{
  render: () => html\`
    <legend-item
      .label=\${"Binary State"}
      .color=\${"#e91e63"}
      .pressed=\${true}
      .opacity=\${0.35}
    ></legend-item>
  \`
}`,...t.parameters?.docs?.source}}};const m=["Visible","Hidden","NoUnit","LowOpacity"];export{r as Hidden,t as LowOpacity,n as NoUnit,e as Visible,m as __namedExportsOrder,l as default};

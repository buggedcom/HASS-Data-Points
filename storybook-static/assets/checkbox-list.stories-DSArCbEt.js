import{b as c}from"./iframe-maWesKjk.js";import"./checkbox-list-Z254-hxP.js";import"./preload-helper-PPVm8Dsz.js";import"./property-DyW-YDBW.js";const m={title:"Atoms/Form/Checkbox List",component:"checkbox-list"},e={render:()=>c`
    <checkbox-list
      .items=${[{name:"temperature",label:"Temperature",checked:!0},{name:"humidity",label:"Humidity",checked:!1},{name:"pressure",label:"Pressure",checked:!0}]}
    ></checkbox-list>
  `},n={render:()=>c`
    <checkbox-list
      .items=${[{name:"mean",label:"Mean",checked:!0},{name:"min",label:"Min",checked:!0},{name:"max",label:"Max",checked:!0}]}
    ></checkbox-list>
  `},r={render:()=>c`
    <checkbox-list
      .items=${[{name:"series_a",label:"Series A",checked:!1},{name:"series_b",label:"Series B",checked:!1}]}
    ></checkbox-list>
  `};e.parameters={...e.parameters,docs:{...e.parameters?.docs,source:{originalSource:`{
  render: () => html\`
    <checkbox-list
      .items=\${[{
    name: "temperature",
    label: "Temperature",
    checked: true
  }, {
    name: "humidity",
    label: "Humidity",
    checked: false
  }, {
    name: "pressure",
    label: "Pressure",
    checked: true
  }]}
    ></checkbox-list>
  \`
}`,...e.parameters?.docs?.source}}};n.parameters={...n.parameters,docs:{...n.parameters?.docs,source:{originalSource:`{
  render: () => html\`
    <checkbox-list
      .items=\${[{
    name: "mean",
    label: "Mean",
    checked: true
  }, {
    name: "min",
    label: "Min",
    checked: true
  }, {
    name: "max",
    label: "Max",
    checked: true
  }]}
    ></checkbox-list>
  \`
}`,...n.parameters?.docs?.source}}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
  render: () => html\`
    <checkbox-list
      .items=\${[{
    name: "series_a",
    label: "Series A",
    checked: false
  }, {
    name: "series_b",
    label: "Series B",
    checked: false
  }]}
    ></checkbox-list>
  \`
}`,...r.parameters?.docs?.source}}};const o=["Default","AllChecked","NoneChecked"];export{n as AllChecked,e as Default,r as NoneChecked,o as __namedExportsOrder,m as default};

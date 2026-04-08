import{b as r}from"./iframe-maWesKjk.js";import"./radio-group-CFoLmpSs.js";import"./preload-helper-PPVm8Dsz.js";import"./property-DyW-YDBW.js";const d={title:"Atoms/Form/Radio Group",component:"radio-group",argTypes:{name:{control:"text"},value:{control:"text"}}},e={render:()=>r`
    <radio-group
      .name=${"period"}
      .value=${"day"}
      .options=${[{value:"hour",label:"Hour"},{value:"day",label:"Day"},{value:"week",label:"Week"}]}
    ></radio-group>
  `},a={render:()=>r`
    <radio-group
      .name=${"stat"}
      .value=${""}
      .options=${[{value:"mean",label:"Mean"},{value:"min",label:"Min"},{value:"max",label:"Max"}]}
    ></radio-group>
  `},o={render:()=>r`
    <radio-group
      .name=${"mode"}
      .value=${"light"}
      .options=${[{value:"light",label:"Light Mode"},{value:"dark",label:"Dark Mode"}]}
    ></radio-group>
  `};e.parameters={...e.parameters,docs:{...e.parameters?.docs,source:{originalSource:`{
  render: () => html\`
    <radio-group
      .name=\${"period"}
      .value=\${"day"}
      .options=\${[{
    value: "hour",
    label: "Hour"
  }, {
    value: "day",
    label: "Day"
  }, {
    value: "week",
    label: "Week"
  }]}
    ></radio-group>
  \`
}`,...e.parameters?.docs?.source}}};a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  render: () => html\`
    <radio-group
      .name=\${"stat"}
      .value=\${""}
      .options=\${[{
    value: "mean",
    label: "Mean"
  }, {
    value: "min",
    label: "Min"
  }, {
    value: "max",
    label: "Max"
  }]}
    ></radio-group>
  \`
}`,...a.parameters?.docs?.source}}};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  render: () => html\`
    <radio-group
      .name=\${"mode"}
      .value=\${"light"}
      .options=\${[{
    value: "light",
    label: "Light Mode"
  }, {
    value: "dark",
    label: "Dark Mode"
  }]}
    ></radio-group>
  \`
}`,...o.parameters?.docs?.source}}};const s=["Default","NoneSelected","TwoOptions"];export{e as Default,a as NoneSelected,o as TwoOptions,s as __namedExportsOrder,d as default};

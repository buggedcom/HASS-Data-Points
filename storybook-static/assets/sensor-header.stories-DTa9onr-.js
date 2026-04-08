import{b as o}from"./iframe-maWesKjk.js";import"./sensor-header-Bv7a3uo7.js";import"./preload-helper-PPVm8Dsz.js";import"./property-DyW-YDBW.js";const m={title:"Charts/Sensor Card/Header",component:"sensor-header",parameters:{layout:"centered"}},a={state:"22.5",attributes:{friendly_name:"Living Room Temperature",unit_of_measurement:"°C",icon:"mdi:thermometer"}},e={render:()=>o`
    <div
      style="width:360px;background:#fff;border-radius:12px;overflow:hidden;font-family:Roboto,sans-serif;"
    >
      <sensor-header
        .name=${"Living Room Temperature"}
        .value=${"22.5"}
        .unit=${"°C"}
        .stateObj=${a}
      ></sensor-header>
    </div>
  `},r={name:"No Unit",render:()=>o`
    <div
      style="width:360px;background:#fff;border-radius:12px;overflow:hidden;font-family:Roboto,sans-serif;"
    >
      <sensor-header
        .name=${"Binary Sensor"}
        .value=${"on"}
        .unit=${""}
      ></sensor-header>
    </div>
  `},n={name:"Long Name (truncation)",render:()=>o`
    <div
      style="width:360px;background:#fff;border-radius:12px;overflow:hidden;font-family:Roboto,sans-serif;"
    >
      <sensor-header
        .name=${"A very long sensor friendly name that should get truncated"}
        .value=${"1.42"}
        .unit=${"kW"}
      ></sensor-header>
    </div>
  `};e.parameters={...e.parameters,docs:{...e.parameters?.docs,source:{originalSource:`{
  render: () => html\`
    <div
      style="width:360px;background:#fff;border-radius:12px;overflow:hidden;font-family:Roboto,sans-serif;"
    >
      <sensor-header
        .name=\${"Living Room Temperature"}
        .value=\${"22.5"}
        .unit=\${"°C"}
        .stateObj=\${mockStateObj}
      ></sensor-header>
    </div>
  \`
}`,...e.parameters?.docs?.source}}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
  name: "No Unit",
  render: () => html\`
    <div
      style="width:360px;background:#fff;border-radius:12px;overflow:hidden;font-family:Roboto,sans-serif;"
    >
      <sensor-header
        .name=\${"Binary Sensor"}
        .value=\${"on"}
        .unit=\${""}
      ></sensor-header>
    </div>
  \`
}`,...r.parameters?.docs?.source}}};n.parameters={...n.parameters,docs:{...n.parameters?.docs,source:{originalSource:`{
  name: "Long Name (truncation)",
  render: () => html\`
    <div
      style="width:360px;background:#fff;border-radius:12px;overflow:hidden;font-family:Roboto,sans-serif;"
    >
      <sensor-header
        .name=\${"A very long sensor friendly name that should get truncated"}
        .value=\${"1.42"}
        .unit=\${"kW"}
      ></sensor-header>
    </div>
  \`
}`,...n.parameters?.docs?.source}}};const f=["Default","NoUnit","LongName"];export{e as Default,n as LongName,r as NoUnit,f as __namedExportsOrder,m as default};

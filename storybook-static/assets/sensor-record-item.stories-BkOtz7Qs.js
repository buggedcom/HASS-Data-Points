import{b as e}from"./iframe-maWesKjk.js";import"./sensor-record-item-DWIkc7Bp.js";import"./preload-helper-PPVm8Dsz.js";import"./property-DyW-YDBW.js";import"./state-D8ZE3MQ0.js";import"./format-DAmR8eHG.js";const g={title:"Charts/Sensor Card/Record Item",component:"sensor-record-item",parameters:{layout:"centered"}},d={id:"evt-1",message:"Unusual spike detected",annotation:"Temperature jumped +4°C in under an hour.",icon:"mdi:thermometer-alert",color:"#f44336",timestamp:new Date(Date.now()-2*3600*1e3).toISOString(),entity_id:"sensor.temperature",device_id:null,area_id:null,label_id:null,dev:!1},i={id:"evt-2",message:"Window opened",annotation:null,icon:"mdi:window-open",color:"#2196f3",timestamp:new Date(Date.now()-1800*1e3).toISOString(),entity_id:"sensor.temperature",device_id:null,area_id:null,label_id:null,dev:!1},l={id:"evt-3",message:"Debug entry",annotation:"Some debug info",icon:"mdi:bug",color:"#9c27b0",timestamp:new Date(Date.now()-300*1e3).toISOString(),entity_id:"sensor.temperature",device_id:null,area_id:null,label_id:null,dev:!0},r="width:360px;background:#fff;border-radius:8px;overflow:hidden;font-family:Roboto,sans-serif;",n={render:()=>e`
    <div style=${r}>
      <sensor-record-item
        .event=${d}
        .showFullMessage=${!0}
      ></sensor-record-item>
    </div>
  `},t={name:"Simple (no annotation)",render:()=>e`
    <div style=${r}>
      <sensor-record-item
        .event=${i}
        .showFullMessage=${!0}
      ></sensor-record-item>
    </div>
  `},s={name:"Hidden (chart marker off)",render:()=>e`
    <div style=${r}>
      <sensor-record-item
        .event=${d}
        .hidden=${!0}
        .showFullMessage=${!0}
      ></sensor-record-item>
    </div>
  `},o={name:"Dev Badge",render:()=>e`
    <div style=${r}>
      <sensor-record-item
        .event=${l}
        .showFullMessage=${!0}
      ></sensor-record-item>
    </div>
  `},a={name:"Collapsed Note",render:()=>e`
    <div style=${r}>
      <sensor-record-item
        .event=${d}
        .showFullMessage=${!1}
      ></sensor-record-item>
    </div>
  `};n.parameters={...n.parameters,docs:{...n.parameters?.docs,source:{originalSource:`{
  render: () => html\`
    <div style=\${wrapStyle}>
      <sensor-record-item
        .event=\${sampleEvent}
        .showFullMessage=\${true}
      ></sensor-record-item>
    </div>
  \`
}`,...n.parameters?.docs?.source}}};t.parameters={...t.parameters,docs:{...t.parameters?.docs,source:{originalSource:`{
  name: "Simple (no annotation)",
  render: () => html\`
    <div style=\${wrapStyle}>
      <sensor-record-item
        .event=\${simpleEvent}
        .showFullMessage=\${true}
      ></sensor-record-item>
    </div>
  \`
}`,...t.parameters?.docs?.source}}};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  name: "Hidden (chart marker off)",
  render: () => html\`
    <div style=\${wrapStyle}>
      <sensor-record-item
        .event=\${sampleEvent}
        .hidden=\${true}
        .showFullMessage=\${true}
      ></sensor-record-item>
    </div>
  \`
}`,...s.parameters?.docs?.source}}};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  name: "Dev Badge",
  render: () => html\`
    <div style=\${wrapStyle}>
      <sensor-record-item
        .event=\${devEvent}
        .showFullMessage=\${true}
      ></sensor-record-item>
    </div>
  \`
}`,...o.parameters?.docs?.source}}};a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  name: "Collapsed Note",
  render: () => html\`
    <div style=\${wrapStyle}>
      <sensor-record-item
        .event=\${sampleEvent}
        .showFullMessage=\${false}
      ></sensor-record-item>
    </div>
  \`
}`,...a.parameters?.docs?.source}}};const w=["Default","Simple","Hidden","DevBadge","CollapsedNote"];export{a as CollapsedNote,n as Default,o as DevBadge,s as Hidden,t as Simple,w as __namedExportsOrder,g as default};

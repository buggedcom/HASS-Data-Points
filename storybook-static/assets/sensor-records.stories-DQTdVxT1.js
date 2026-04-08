import{b as r}from"./iframe-maWesKjk.js";import"./sensor-records-y56EbN_o.js";import"./preload-helper-PPVm8Dsz.js";import"./property-DyW-YDBW.js";import"./state-D8ZE3MQ0.js";import"./pagination-CjLcFMPQ.js";import"./sensor-record-item-DWIkc7Bp.js";import"./format-DAmR8eHG.js";const g={title:"Charts/Sensor Card/Records",component:"sensor-records",parameters:{layout:"centered"}},i=Date.now(),l=[{id:"evt-1",message:"Unusual spike detected",annotation:"Temperature jumped +4°C in under an hour.",icon:"mdi:thermometer-alert",color:"#f44336",timestamp:new Date(i-2*3600*1e3).toISOString(),entity_id:"sensor.temperature",device_id:null,area_id:null,label_id:null,dev:!1},{id:"evt-2",message:"Window opened",annotation:null,icon:"mdi:window-open",color:"#2196f3",timestamp:new Date(i-1*3600*1e3).toISOString(),entity_id:"sensor.temperature",device_id:null,area_id:null,label_id:null,dev:!1},{id:"evt-3",message:"Heating turned on",annotation:"Manual override via thermostat.",icon:"mdi:radiator",color:"#ff9800",timestamp:new Date(i-1800*1e3).toISOString(),entity_id:"sensor.temperature",device_id:null,area_id:null,label_id:null,dev:!1}],m=Array.from({length:7},(c,e)=>({id:`evt-${e}`,message:`Event ${e+1}`,annotation:e%2===0?`Annotation for event ${e+1}`:null,icon:"mdi:bookmark",color:"#607d8b",timestamp:new Date(i-e*3600*1e3).toISOString(),entity_id:"sensor.temperature",device_id:null,area_id:null,label_id:null,dev:!1})),n="width:360px;height:240px;background:#fff;border-radius:8px;overflow:hidden;font-family:Roboto,sans-serif;display:flex;flex-direction:column;",s={render:()=>r`
    <div style=${n}>
      <sensor-records .events=${l}></sensor-records>
    </div>
  `},t={name:"Empty State",render:()=>r`
    <div style=${n}>
      <sensor-records .events=${[]}></sensor-records>
    </div>
  `},o={name:"With Pagination",render:()=>r`
    <div style=${n}>
      <sensor-records .events=${m} .pageSize=${3}></sensor-records>
    </div>
  `},a={name:"With Hidden Events",render:()=>r`
    <div style=${n}>
      <sensor-records
        .events=${l}
        .hiddenEventIds=${new Set(["evt-1"])}
      ></sensor-records>
    </div>
  `},d={name:"Collapsed Notes",render:()=>r`
    <div style=${n}>
      <sensor-records
        .events=${l}
        .showFullMessage=${!1}
      ></sensor-records>
    </div>
  `};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  render: () => html\`
    <div style=\${wrapStyle}>
      <sensor-records .events=\${sampleEvents}></sensor-records>
    </div>
  \`
}`,...s.parameters?.docs?.source}}};t.parameters={...t.parameters,docs:{...t.parameters?.docs,source:{originalSource:`{
  name: "Empty State",
  render: () => html\`
    <div style=\${wrapStyle}>
      <sensor-records .events=\${[]}></sensor-records>
    </div>
  \`
}`,...t.parameters?.docs?.source}}};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  name: "With Pagination",
  render: () => html\`
    <div style=\${wrapStyle}>
      <sensor-records .events=\${manyEvents} .pageSize=\${3}></sensor-records>
    </div>
  \`
}`,...o.parameters?.docs?.source}}};a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  name: "With Hidden Events",
  render: () => html\`
    <div style=\${wrapStyle}>
      <sensor-records
        .events=\${sampleEvents}
        .hiddenEventIds=\${new Set(["evt-1"])}
      ></sensor-records>
    </div>
  \`
}`,...a.parameters?.docs?.source}}};d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  name: "Collapsed Notes",
  render: () => html\`
    <div style=\${wrapStyle}>
      <sensor-records
        .events=\${sampleEvents}
        .showFullMessage=\${false}
      ></sensor-records>
    </div>
  \`
}`,...d.parameters?.docs?.source}}};const w=["Default","Empty","WithPagination","WithHiddenEvents","CollapsedNotes"];export{d as CollapsedNotes,s as Default,t as Empty,a as WithHiddenEvents,o as WithPagination,w as __namedExportsOrder,g as default};

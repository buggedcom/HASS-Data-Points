import{b as c}from"./iframe-maWesKjk.js";import"./sensor-chart-Cdz5ukMg.js";import"./preload-helper-PPVm8Dsz.js";import"./constants-B5c5KCbY.js";import"./color-BkgFqjP8.js";import"./chart-dom-bf6ubeYH.js";import"./format-DAmR8eHG.js";const _={title:"Charts/Sensor Card/Chart",component:"sensor-chart",parameters:{layout:"centered"}};function l(n,e,t,p){const u=Date.now();return{[n]:Array.from({length:e+1},(h,m)=>{const w=u-(e-m)*3600*1e3;return{s:(t+p*Math.sin(m/e*Math.PI*4)).toFixed(1),lu:w/1e3}})}}function d(n,e){const t=Date.now();return[{id:"evt-1",message:"Unusual spike detected",annotation:"Temperature jumped +4°C in under an hour.",icon:"mdi:thermometer-alert",color:"#f44336",timestamp:new Date(t-e*.7*3600*1e3).toISOString(),entity_id:n,device_id:null,area_id:null,label_id:null,dev:!1},{id:"evt-2",message:"Window opened",annotation:null,icon:"mdi:window-open",color:"#2196f3",timestamp:new Date(t-e*.4*3600*1e3).toISOString(),entity_id:n,device_id:null,area_id:null,label_id:null,dev:!1}]}const i="width:360px;height:120px;background:#fff;border-radius:8px;overflow:hidden;font-family:Roboto,sans-serif;",a={render:()=>c`<div style=${i}><sensor-chart></sensor-chart></div>`,play:async({canvasElement:n})=>{const e=n.querySelector("sensor-chart");await e.updateComplete;const t=Date.now();e.draw(l("sensor.temperature",24,21.5,3),[],t-24*3600*1e3,t,{entity:"sensor.temperature"},"°C",new Set),await e.updateComplete}},r={name:"With Annotation Circles",render:()=>c`<div style=${i}><sensor-chart></sensor-chart></div>`,play:async({canvasElement:n})=>{const e=n.querySelector("sensor-chart");await e.updateComplete;const t=Date.now();e.draw(l("sensor.temperature",24,21.5,3),d("sensor.temperature",24),t-24*3600*1e3,t,{entity:"sensor.temperature",annotation_style:"circle"},"°C",new Set),await e.updateComplete}},o={name:"With Annotation Lines",render:()=>c`<div style=${i}><sensor-chart></sensor-chart></div>`,play:async({canvasElement:n})=>{const e=n.querySelector("sensor-chart");await e.updateComplete;const t=Date.now();e.draw(l("sensor.temperature",24,21.5,3),d("sensor.temperature",24),t-24*3600*1e3,t,{entity:"sensor.temperature",annotation_style:"line"},"°C",new Set),await e.updateComplete}},s={name:"No Numeric Data",render:()=>c`<div style=${i}><sensor-chart></sensor-chart></div>`,play:async({canvasElement:n})=>{const e=n.querySelector("sensor-chart");await e.updateComplete;const t=Date.now();e.draw({"sensor.temperature":[{s:"unavailable",lu:t/1e3}]},[],t-24*3600*1e3,t,{entity:"sensor.temperature"},"°C",new Set),await e.updateComplete}};a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  render: () => html\`<div style=\${wrapStyle}><sensor-chart></sensor-chart></div>\`,
  play: async ({
    canvasElement
  }) => {
    const chartEl = canvasElement.querySelector("sensor-chart") as SensorChart & {
      draw: (...args: unknown[]) => void;
    };
    await chartEl.updateComplete;
    const now = Date.now();
    chartEl.draw(makeHistory("sensor.temperature", 24, 21.5, 3.0), [], now - 24 * 3600 * 1000, now, {
      entity: "sensor.temperature"
    }, "°C", new Set());
    await chartEl.updateComplete;
  }
}`,...a.parameters?.docs?.source}}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
  name: "With Annotation Circles",
  render: () => html\`<div style=\${wrapStyle}><sensor-chart></sensor-chart></div>\`,
  play: async ({
    canvasElement
  }) => {
    const chartEl = canvasElement.querySelector("sensor-chart") as SensorChart & {
      draw: (...args: unknown[]) => void;
    };
    await chartEl.updateComplete;
    const now = Date.now();
    chartEl.draw(makeHistory("sensor.temperature", 24, 21.5, 3.0), makeEvents("sensor.temperature", 24), now - 24 * 3600 * 1000, now, {
      entity: "sensor.temperature",
      annotation_style: "circle"
    }, "°C", new Set());
    await chartEl.updateComplete;
  }
}`,...r.parameters?.docs?.source}}};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  name: "With Annotation Lines",
  render: () => html\`<div style=\${wrapStyle}><sensor-chart></sensor-chart></div>\`,
  play: async ({
    canvasElement
  }) => {
    const chartEl = canvasElement.querySelector("sensor-chart") as SensorChart & {
      draw: (...args: unknown[]) => void;
    };
    await chartEl.updateComplete;
    const now = Date.now();
    chartEl.draw(makeHistory("sensor.temperature", 24, 21.5, 3.0), makeEvents("sensor.temperature", 24), now - 24 * 3600 * 1000, now, {
      entity: "sensor.temperature",
      annotation_style: "line"
    }, "°C", new Set());
    await chartEl.updateComplete;
  }
}`,...o.parameters?.docs?.source}}};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  name: "No Numeric Data",
  render: () => html\`<div style=\${wrapStyle}><sensor-chart></sensor-chart></div>\`,
  play: async ({
    canvasElement
  }) => {
    const chartEl = canvasElement.querySelector("sensor-chart") as SensorChart & {
      draw: (...args: unknown[]) => void;
    };
    await chartEl.updateComplete;
    const now = Date.now();
    // Pass empty history — no numeric data
    chartEl.draw({
      "sensor.temperature": [{
        s: "unavailable",
        lu: now / 1000
      }]
    }, [], now - 24 * 3600 * 1000, now, {
      entity: "sensor.temperature"
    }, "°C", new Set());
    await chartEl.updateComplete;
  }
}`,...s.parameters?.docs?.source}}};const k=["Default","WithAnnotations","WithAnnotationLines","NoData"];export{a as Default,s as NoData,o as WithAnnotationLines,r as WithAnnotations,k as __namedExportsOrder,_ as default};

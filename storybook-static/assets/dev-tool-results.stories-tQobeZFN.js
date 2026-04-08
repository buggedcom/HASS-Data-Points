import{b as s}from"./iframe-maWesKjk.js";import{e as r}from"./index-BVN6m9Ti.js";import"./dev-tool-results-7zrzigGW.js";import"./preload-helper-PPVm8Dsz.js";import"./property-DyW-YDBW.js";import"./state-D8ZE3MQ0.js";import"./format-DAmR8eHG.js";import"./feedback-banner-DFx7uwUC.js";const n=[{id:1,label:"Window 1",startDt:"",endDt:"",selected:[0,1],changes:[{timestamp:"2026-03-31T10:00:00.000Z",message:"Bedroom radiator turned on",entity_id:"switch.bedroom_radiator",icon:"mdi:radiator",color:"#ff9800"},{timestamp:"2026-03-31T10:15:00.000Z",message:"Bedroom window opened",entity_id:"binary_sensor.bedroom_window",icon:"mdi:window-open",color:"#4caf50"}]}],y={title:"Cards/Dev Tool/Results",component:"dev-tool-results",parameters:{actions:{handles:["dp-record-selected-request","dp-results-selection-change"]}}},e={render:()=>s`<dev-tool-results .results=${n}></dev-tool-results>`,play:async({canvasElement:o})=>{const t=o.querySelector("dev-tool-results");r(t.shadowRoot.querySelector("#record-btn")).toBeTruthy()}};e.parameters={...e.parameters,docs:{...e.parameters?.docs,source:{originalSource:`{
  render: () => html\`<dev-tool-results .results=\${sampleResults}></dev-tool-results>\`,
  play: async ({
    canvasElement
  }: {
    canvasElement: HTMLElement;
  }) => {
    const el = canvasElement.querySelector("dev-tool-results") as HTMLElement & {
      shadowRoot: ShadowRoot;
    };
    expect(el.shadowRoot.querySelector("#record-btn")).toBeTruthy();
  }
}`,...e.parameters?.docs?.source}}};const v=["Default"];export{e as Default,v as __namedExportsOrder,y as default};

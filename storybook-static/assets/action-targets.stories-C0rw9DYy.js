import{b as n}from"./iframe-maWesKjk.js";import{e as a}from"./index-BVN6m9Ti.js";import{c as l}from"./mock-hass-fqpCrfSc.js";import"./action-targets-DgnUedy-.js";import"./preload-helper-PPVm8Dsz.js";import"./property-DyW-YDBW.js";import"./state-D8ZE3MQ0.js";import"./chip-group-CRK0J3ni.js";import"./entity-chip-B-eFJyDu.js";const c=l(),i=[{type:"entity",id:"sensor.temperature"},{type:"area",id:"bedroom"}],w={title:"Cards/Action/Targets",component:"action-targets",parameters:{actions:{handles:["dp-target-change"]}}},t={render:()=>n`
    <action-targets
      .hass=${c}
      .showConfigTargets=${!0}
      .showTargetPicker=${!0}
      .configChips=${i}
    ></action-targets>
  `,play:async({canvasElement:s})=>{const e=s.querySelector("action-targets");a(e.shadowRoot.querySelector("chip-group")).toBeTruthy(),a(e.shadowRoot.querySelector("ha-selector")).toBeTruthy()}},o={render:()=>n`
    <action-targets
      .hass=${c}
      .showConfigTargets=${!0}
      .showTargetPicker=${!1}
      .configChips=${i}
    ></action-targets>
  `},r={render:()=>n`
    <action-targets
      .hass=${c}
      .showConfigTargets=${!1}
      .showTargetPicker=${!0}
      .configChips=${i}
    ></action-targets>
  `,play:async({canvasElement:s})=>{const e=s.querySelector("action-targets");a(e.shadowRoot.querySelector("chip-group")).toBeNull(),a(e.shadowRoot.querySelector("ha-selector")).toBeTruthy()}};t.parameters={...t.parameters,docs:{...t.parameters?.docs,source:{originalSource:`{
  render: () => html\`
    <action-targets
      .hass=\${mockHass}
      .showConfigTargets=\${true}
      .showTargetPicker=\${true}
      .configChips=\${sampleChips}
    ></action-targets>
  \`,
  play: async ({
    canvasElement
  }: {
    canvasElement: HTMLElement;
  }) => {
    const el = canvasElement.querySelector("action-targets") as HTMLElement & {
      shadowRoot: ShadowRoot;
    };
    expect(el.shadowRoot.querySelector("chip-group")).toBeTruthy();
    expect(el.shadowRoot.querySelector("ha-selector")).toBeTruthy();
  }
}`,...t.parameters?.docs?.source}}};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  render: () => html\`
    <action-targets
      .hass=\${mockHass}
      .showConfigTargets=\${true}
      .showTargetPicker=\${false}
      .configChips=\${sampleChips}
    ></action-targets>
  \`
}`,...o.parameters?.docs?.source}}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
  render: () => html\`
    <action-targets
      .hass=\${mockHass}
      .showConfigTargets=\${false}
      .showTargetPicker=\${true}
      .configChips=\${sampleChips}
    ></action-targets>
  \`,
  play: async ({
    canvasElement
  }: {
    canvasElement: HTMLElement;
  }) => {
    const el = canvasElement.querySelector("action-targets") as HTMLElement & {
      shadowRoot: ShadowRoot;
    };
    expect(el.shadowRoot.querySelector("chip-group")).toBeNull();
    expect(el.shadowRoot.querySelector("ha-selector")).toBeTruthy();
  }
}`,...r.parameters?.docs?.source}}};const $=["Default","ConfigTargetsOnly","TargetPickerOnly"];export{o as ConfigTargetsOnly,t as Default,r as TargetPickerOnly,$ as __namedExportsOrder,w as default};

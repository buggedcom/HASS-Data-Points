import{b as t}from"./iframe-maWesKjk.js";import{e as s}from"./index-BVN6m9Ti.js";import"./dev-tool-windows-Cqz0ff1a.js";import"./preload-helper-PPVm8Dsz.js";import"./property-DyW-YDBW.js";import"./state-D8ZE3MQ0.js";const m={title:"Cards/Dev Tool/Windows",component:"dev-tool-windows"},e={render:()=>t`<dev-tool-windows></dev-tool-windows>`,play:async({canvasElement:n})=>{const r=n.querySelector("dev-tool-windows");s(r.shadowRoot.querySelectorAll(".window-row")).toHaveLength(1)}},o={render:()=>t`
    <dev-tool-windows
      .windows=${[{id:1,label:"Bedroom",startDt:"",endDt:""},{id:2,label:"Outside",startDt:"2026-03-31T10:00",endDt:"2026-04-02T10:00"}]}
    ></dev-tool-windows>
  `};e.parameters={...e.parameters,docs:{...e.parameters?.docs,source:{originalSource:`{
  render: () => html\`<dev-tool-windows></dev-tool-windows>\`,
  play: async ({
    canvasElement
  }: {
    canvasElement: HTMLElement;
  }) => {
    const el = canvasElement.querySelector("dev-tool-windows") as HTMLElement & {
      shadowRoot: ShadowRoot;
    };
    expect(el.shadowRoot.querySelectorAll(".window-row")).toHaveLength(1);
  }
}`,...e.parameters?.docs?.source}}};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  render: () => html\`
    <dev-tool-windows
      .windows=\${[{
    id: 1,
    label: "Bedroom",
    startDt: "",
    endDt: ""
  }, {
    id: 2,
    label: "Outside",
    startDt: "2026-03-31T10:00",
    endDt: "2026-04-02T10:00"
  }]}
    ></dev-tool-windows>
  \`
}`,...o.parameters?.docs?.source}}};const p=["Default","Multiple"];export{e as Default,o as Multiple,p as __namedExportsOrder,m as default};

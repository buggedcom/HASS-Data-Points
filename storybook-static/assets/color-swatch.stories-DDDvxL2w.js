import{b as t}from"./iframe-maWesKjk.js";import{e as l}from"./index-BVN6m9Ti.js";import"./color-swatch-vfYtshcF.js";import"./preload-helper-PPVm8Dsz.js";import"./property-DyW-YDBW.js";const d={title:"Atoms/Display/Color Swatch",component:"color-swatch",argTypes:{color:{control:"color"},label:{control:"text"}}},o={render:()=>t`<color-swatch
      .color=${"#ff9800"}
      .label=${"Event Color"}
    ></color-swatch>`,play:async({canvasElement:c})=>{const a=c.querySelector("color-swatch");l(a.shadowRoot.textContent).toContain("Event Color")}},e={render:()=>t`<color-swatch .color=${"#4caf50"}></color-swatch>`},r={render:()=>t`<color-swatch
      .color=${"#2196f3"}
      .label=${"Series Color"}
    ></color-swatch>`};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  render: () => html\`<color-swatch
      .color=\${"#ff9800"}
      .label=\${"Event Color"}
    ></color-swatch>\`,
  play: async ({
    canvasElement
  }: {
    canvasElement: HTMLElement;
  }) => {
    const el = canvasElement.querySelector("color-swatch") as HTMLElement & {
      shadowRoot: ShadowRoot;
    };
    expect(el.shadowRoot.textContent).toContain("Event Color");
  }
}`,...o.parameters?.docs?.source}}};e.parameters={...e.parameters,docs:{...e.parameters?.docs,source:{originalSource:'{\n  render: () => html`<color-swatch .color=${"#4caf50"}></color-swatch>`\n}',...e.parameters?.docs?.source}}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
  render: () => html\`<color-swatch
      .color=\${"#2196f3"}
      .label=\${"Series Color"}
    ></color-swatch>\`
}`,...r.parameters?.docs?.source}}};const w=["Default","NoLabel","Blue"];export{r as Blue,o as Default,e as NoLabel,w as __namedExportsOrder,d as default};

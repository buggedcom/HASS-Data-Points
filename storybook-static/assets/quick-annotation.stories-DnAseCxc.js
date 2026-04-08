import{b as a}from"./iframe-maWesKjk.js";import{e as o}from"./index-BVN6m9Ti.js";import"./quick-annotation-DYEd2znA.js";import"./preload-helper-PPVm8Dsz.js";import"./property-DyW-YDBW.js";const u={title:"Cards/Quick/Annotation",component:"quick-annotation",parameters:{actions:{handles:["dp-annotation-input"]}}},e={render:()=>a`
    <quick-annotation .value=${"Detailed note"}></quick-annotation>
  `,play:async({canvasElement:t})=>{const n=t.querySelector("quick-annotation");o(n.shadowRoot.querySelector("textarea").value).toBe("Detailed note")}};e.parameters={...e.parameters,docs:{...e.parameters?.docs,source:{originalSource:`{
  render: () => html\`
    <quick-annotation .value=\${"Detailed note"}></quick-annotation>
  \`,
  play: async ({
    canvasElement
  }: {
    canvasElement: HTMLElement;
  }) => {
    const el = canvasElement.querySelector("quick-annotation") as HTMLElement & {
      shadowRoot: ShadowRoot;
    };
    expect((el.shadowRoot.querySelector("textarea") as HTMLTextAreaElement).value).toBe("Detailed note");
  }
}`,...e.parameters?.docs?.source}}};const m=["Default"];export{e as Default,m as __namedExportsOrder,u as default};

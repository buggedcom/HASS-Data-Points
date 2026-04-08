import{b as r}from"./iframe-maWesKjk.js";import{e as o}from"./index-BVN6m9Ti.js";import"./feedback-banner-DFx7uwUC.js";import"./preload-helper-PPVm8Dsz.js";import"./property-DyW-YDBW.js";const l={title:"Atoms/Display/Feedback Banner",component:"feedback-banner"},e={render:()=>r`
    <feedback-banner
      .kind=${"ok"}
      .text=${"Saved"}
      .visible=${!0}
    ></feedback-banner>
  `,play:async({canvasElement:a})=>{const t=a.querySelector("feedback-banner");o(t.shadowRoot.textContent).toContain("Saved")}},n={render:()=>r`
    <feedback-banner
      .kind=${"err"}
      .text=${"Error: failed"}
      .visible=${!0}
    ></feedback-banner>
  `};e.parameters={...e.parameters,docs:{...e.parameters?.docs,source:{originalSource:`{
  render: () => html\`
    <feedback-banner
      .kind=\${"ok"}
      .text=\${"Saved"}
      .visible=\${true}
    ></feedback-banner>
  \`,
  play: async ({
    canvasElement
  }: {
    canvasElement: HTMLElement;
  }) => {
    const el = canvasElement.querySelector("feedback-banner") as HTMLElement & {
      shadowRoot: ShadowRoot;
    };
    expect(el.shadowRoot.textContent).toContain("Saved");
  }
}`,...e.parameters?.docs?.source}}};n.parameters={...n.parameters,docs:{...n.parameters?.docs,source:{originalSource:`{
  render: () => html\`
    <feedback-banner
      .kind=\${"err"}
      .text=\${"Error: failed"}
      .visible=\${true}
    ></feedback-banner>
  \`
}`,...n.parameters?.docs?.source}}};const m=["Success","Error"];export{n as Error,e as Success,m as __namedExportsOrder,l as default};

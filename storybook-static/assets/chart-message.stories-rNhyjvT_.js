import{b as t}from"./iframe-maWesKjk.js";import{e as n}from"./index-BVN6m9Ti.js";import"./chart-message-CcELwwzA.js";import"./preload-helper-PPVm8Dsz.js";import"./property-DyW-YDBW.js";const h={title:"Atoms/Display/Chart Message",component:"chart-message",argTypes:{message:{control:"text"}}},e={render:()=>t`
    <div style="position: relative; height: 200px; background: #1c1c1c;">
      <chart-message></chart-message>
    </div>
  `},a={render:()=>t`
    <div style="position: relative; height: 200px; background: #1c1c1c;">
      <chart-message
        .message=${"No data available for this period"}
      ></chart-message>
    </div>
  `,play:async({canvasElement:r})=>{const o=r.querySelector("chart-message");n(o.shadowRoot.textContent).toContain("No data available for this period")}},s={render:()=>t`
    <div style="position: relative; height: 200px; background: #1c1c1c;">
      <chart-message .message=${"Failed to load history data"}></chart-message>
    </div>
  `};e.parameters={...e.parameters,docs:{...e.parameters?.docs,source:{originalSource:`{
  render: () => html\`
    <div style="position: relative; height: 200px; background: #1c1c1c;">
      <chart-message></chart-message>
    </div>
  \`
}`,...e.parameters?.docs?.source}}};a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  render: () => html\`
    <div style="position: relative; height: 200px; background: #1c1c1c;">
      <chart-message
        .message=\${"No data available for this period"}
      ></chart-message>
    </div>
  \`,
  play: async ({
    canvasElement
  }: {
    canvasElement: HTMLElement;
  }) => {
    const el = canvasElement.querySelector("chart-message") as HTMLElement & {
      shadowRoot: ShadowRoot;
    };
    expect(el.shadowRoot.textContent).toContain("No data available for this period");
  }
}`,...a.parameters?.docs?.source}}};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  render: () => html\`
    <div style="position: relative; height: 200px; background: #1c1c1c;">
      <chart-message .message=\${"Failed to load history data"}></chart-message>
    </div>
  \`
}`,...s.parameters?.docs?.source}}};const g=["Hidden","WithMessage","ErrorMessage"];export{s as ErrorMessage,e as Hidden,a as WithMessage,g as __namedExportsOrder,h as default};

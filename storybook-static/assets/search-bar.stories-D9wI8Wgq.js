import{b as o}from"./iframe-maWesKjk.js";import{e as t,u as c}from"./index-BVN6m9Ti.js";import"./search-bar-B1P0kLN7.js";import"./preload-helper-PPVm8Dsz.js";import"./property-DyW-YDBW.js";const d={title:"Atoms/Interactive/Search Bar",component:"search-bar"},e={render:()=>o`
    <search-bar .placeholder=${"Search records..."}></search-bar>
  `,play:async({canvasElement:n})=>{const a=n.querySelector("search-bar").shadowRoot.querySelector("input");t(a.placeholder).toBe("Search records..."),await c.type(a,"motion"),t(a.value).toBe("motion")}},r={render:()=>o`
    <search-bar
      .query=${"temperature"}
      .placeholder=${"Search records..."}
    ></search-bar>
  `};e.parameters={...e.parameters,docs:{...e.parameters?.docs,source:{originalSource:`{
  render: () => html\`
    <search-bar .placeholder=\${"Search records..."}></search-bar>
  \`,
  play: async ({
    canvasElement
  }: {
    canvasElement: HTMLElement;
  }) => {
    const el = canvasElement.querySelector("search-bar") as HTMLElement & {
      shadowRoot: ShadowRoot;
    };
    const input = el.shadowRoot.querySelector("input") as HTMLInputElement;
    expect(input.placeholder).toBe("Search records...");
    await userEvent.type(input, "motion");
    expect(input.value).toBe("motion");
  }
}`,...e.parameters?.docs?.source}}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
  render: () => html\`
    <search-bar
      .query=\${"temperature"}
      .placeholder=\${"Search records..."}
    ></search-bar>
  \`
}`,...r.parameters?.docs?.source}}};const i=["Empty","WithQuery"];export{e as Empty,r as WithQuery,i as __namedExportsOrder,d as default};

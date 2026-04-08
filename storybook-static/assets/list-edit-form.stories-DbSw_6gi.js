import{b as n}from"./iframe-maWesKjk.js";import{e as r}from"./index-BVN6m9Ti.js";import{c as s}from"./mock-hass-fqpCrfSc.js";import"./list-edit-form-CEN9a3dg.js";import"./preload-helper-PPVm8Dsz.js";import"./property-DyW-YDBW.js";import"./state-D8ZE3MQ0.js";const f={title:"Cards/List/Edit Form",component:"list-edit-form",parameters:{actions:{handles:["dp-save-edit","dp-cancel-edit"]}}},e={render:()=>n`
    <list-edit-form
      .hass=${s()}
      .eventRecord=${{id:"evt-1",message:"First event",annotation:"Detailed note",icon:"mdi:bookmark",color:"#03a9f4"}}
    ></list-edit-form>
  `,play:async({canvasElement:t})=>{const o=t.querySelector("list-edit-form");r(o.shadowRoot.querySelector(".edit-msg").value).toBe("First event")}};e.parameters={...e.parameters,docs:{...e.parameters?.docs,source:{originalSource:`{
  render: () => html\`
    <list-edit-form
      .hass=\${createMockHass()}
      .eventRecord=\${{
    id: "evt-1",
    message: "First event",
    annotation: "Detailed note",
    icon: "mdi:bookmark",
    color: "#03a9f4"
  }}
    ></list-edit-form>
  \`,
  play: async ({
    canvasElement
  }: {
    canvasElement: HTMLElement;
  }) => {
    const el = canvasElement.querySelector("list-edit-form") as HTMLElement & {
      shadowRoot: ShadowRoot;
    };
    expect((el.shadowRoot.querySelector(".edit-msg") as HTMLInputElement).value).toBe("First event");
  }
}`,...e.parameters?.docs?.source}}};const v=["Default"];export{e as Default,v as __namedExportsOrder,f as default};

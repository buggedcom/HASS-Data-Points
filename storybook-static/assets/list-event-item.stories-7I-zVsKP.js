import{b as a}from"./iframe-maWesKjk.js";import{e as r}from"./index-BVN6m9Ti.js";import{c as l}from"./mock-hass-fqpCrfSc.js";import"./list-event-item-3Sed5e7m.js";import"./preload-helper-PPVm8Dsz.js";import"./property-DyW-YDBW.js";import"./state-D8ZE3MQ0.js";import"./color-BkgFqjP8.js";import"./format-DAmR8eHG.js";import"./entity-name-TOInf1r0.js";import"./list-edit-form-CEN9a3dg.js";const i={id:"evt-1",message:"First event",annotation:"Detailed note",icon:"mdi:bookmark",color:"#03a9f4",timestamp:"2026-03-31T10:00:00Z",entity_ids:["sensor.temperature"]},c={hass:l(),showActions:!0,showEntities:!0,showFullMessage:!1,hidden:!1,editing:!1,editColor:"#03a9f4",language:{showAnnotation:"Show annotation",openHistory:"Open related data point history",editRecord:"Edit record",deleteRecord:"Delete record",showChartMarker:"Show chart marker",hideChartMarker:"Hide chart marker",chooseColor:"Choose colour",save:"Save",cancel:"Cancel",message:"Message",annotationFullMessage:"Annotation / full message"}},R={title:"Cards/List/Event Item",component:"list-event-item",parameters:{actions:{handles:["dp-open-history","dp-edit-event","dp-delete-event","dp-toggle-visibility","dp-more-info","dp-save-edit","dp-cancel-edit"]}}},t={render:()=>a`<list-event-item
      .eventRecord=${i}
      .context=${c}
    ></list-event-item>`,play:async({canvasElement:s})=>{const e=s.querySelector("list-event-item");r(e.shadowRoot.textContent).toContain("First event")}},n={render:()=>a`
    <list-event-item
      .eventRecord=${i}
      .context=${{...c,editing:!0}}
    ></list-event-item>
  `},o={render:()=>a`
    <list-event-item
      .eventRecord=${i}
      .context=${{...c,hidden:!0}}
    ></list-event-item>
  `,play:async({canvasElement:s})=>{const e=s.querySelector("list-event-item");r(e.shadowRoot.querySelector(".event-item")?.classList.contains("is-hidden")).toBe(!0),r(e.shadowRoot.querySelector('ha-icon-button[label="Show chart marker"]')).toBeTruthy()}};t.parameters={...t.parameters,docs:{...t.parameters?.docs,source:{originalSource:`{
  render: () => html\`<list-event-item
      .eventRecord=\${baseEvent}
      .context=\${baseContext}
    ></list-event-item>\`,
  play: async ({
    canvasElement
  }: {
    canvasElement: HTMLElement;
  }) => {
    const el = canvasElement.querySelector("list-event-item") as HTMLElement & {
      shadowRoot: ShadowRoot;
    };
    expect(el.shadowRoot.textContent).toContain("First event");
  }
}`,...t.parameters?.docs?.source}}};n.parameters={...n.parameters,docs:{...n.parameters?.docs,source:{originalSource:`{
  render: () => html\`
    <list-event-item
      .eventRecord=\${baseEvent}
      .context=\${{
    ...baseContext,
    editing: true
  }}
    ></list-event-item>
  \`
}`,...n.parameters?.docs?.source}}};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  render: () => html\`
    <list-event-item
      .eventRecord=\${baseEvent}
      .context=\${{
    ...baseContext,
    hidden: true
  }}
    ></list-event-item>
  \`,
  play: async ({
    canvasElement
  }: {
    canvasElement: HTMLElement;
  }) => {
    const el = canvasElement.querySelector("list-event-item") as HTMLElement & {
      shadowRoot: ShadowRoot;
    };
    expect(el.shadowRoot.querySelector(".event-item")?.classList.contains("is-hidden")).toBe(true);
    expect(el.shadowRoot.querySelector('ha-icon-button[label="Show chart marker"]')).toBeTruthy();
  }
}`,...o.parameters?.docs?.source}}};const S=["Default","Editing","Hidden"];export{t as Default,n as Editing,o as Hidden,S as __namedExportsOrder,R as default};

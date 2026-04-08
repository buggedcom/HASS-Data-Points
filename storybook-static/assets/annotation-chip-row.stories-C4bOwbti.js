import{b as m}from"./iframe-maWesKjk.js";import{f as d,e as a}from"./index-BVN6m9Ti.js";import"./annotation-chip-row-DlfpTpb7.js";import"./preload-helper-PPVm8Dsz.js";import"./property-DyW-YDBW.js";import"./repeat-Dcg3Fkk0.js";import"./directive-jorct-Oe.js";import"./annotation-chip-BpF_qtuH.js";const p=[{type:"entity_id",itemId:"sensor.living_room_temp",icon:"mdi:thermometer",name:"Living room temp"},{type:"entity_id",itemId:"sensor.outdoor_humidity",icon:"mdi:water-percent",name:"Outdoor humidity"}],l=[{type:"entity_id",itemId:"sensor.living_room_temp",icon:"mdi:thermometer",name:"Living room temp"},{type:"device_id",itemId:"device-abc",icon:"mdi:devices",name:"My thermostat"},{type:"area_id",itemId:"living_room",icon:"mdi:sofa",name:"Living room"}],E={title:"Molecules/Annotation Chip Row",component:"annotation-chip-row",parameters:{actions:{handles:["dp-target-remove"]},docs:{description:{component:"`annotation-chip-row` renders a labelled group of removable annotation\ntarget chips with empty-state support.\n\n@fires dp-target-remove - `{ type: string, id: string }` fired when a chip is removed"}}},argTypes:{chips:{control:"object",description:"Array of pre-resolved chip items: `{ type, itemId, icon, name }`."},label:{control:"text",description:"Section label shown above the chips."},helpText:{control:"text",description:"Help text shown below the label when chips are present."},emptyText:{control:"text",description:"Help text shown when there are no chips."}},args:{chips:p,label:"Linked targets",helpText:"These targets will be associated with the new data point by default. Remove any that should not be linked.",emptyText:"No linked targets will be associated with this data point."},render:e=>m`
    <annotation-chip-row
      .chips=${e.chips}
      .label=${e.label}
      .helpText=${e.helpText}
      .emptyText=${e.emptyText}
    ></annotation-chip-row>
  `},t={},o={args:{chips:l}},i={args:{chips:[{type:"entity_id",itemId:"sensor.power",icon:"mdi:flash",name:"Power usage"}]}},n={args:{chips:[]}},r={args:{chips:p},play:async({canvasElement:e})=>{const c=e.querySelector("annotation-chip-row"),s=d();c.addEventListener("dp-target-remove",s),c.shadowRoot.querySelector(".context-chip-row").dispatchEvent(new CustomEvent("dp-chip-remove",{detail:{type:"entity_id",itemId:"sensor.living_room_temp"},bubbles:!0,composed:!0})),await a(s).toHaveBeenCalledOnce(),await a(s.mock.calls[0][0].detail.type).toBe("entity_id"),await a(s.mock.calls[0][0].detail.id).toBe("sensor.living_room_temp")}};t.parameters={...t.parameters,docs:{...t.parameters?.docs,source:{originalSource:"{}",...t.parameters?.docs?.source},description:{story:"Two entity chips with remove buttons.",...t.parameters?.docs?.description}}};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  args: {
    chips: MIXED_CHIPS
  }
}`,...o.parameters?.docs?.source},description:{story:"Mixed entity, device, and area chips.",...o.parameters?.docs?.description}}};i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`{
  args: {
    chips: [{
      type: "entity_id",
      itemId: "sensor.power",
      icon: "mdi:flash",
      name: "Power usage"
    }]
  }
}`,...i.parameters?.docs?.source},description:{story:"Single chip.",...i.parameters?.docs?.description}}};n.parameters={...n.parameters,docs:{...n.parameters?.docs,source:{originalSource:`{
  args: {
    chips: []
  }
}`,...n.parameters?.docs?.source},description:{story:"Empty state — no chips, shows the emptyText.",...n.parameters?.docs?.description}}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
  args: {
    chips: ENTITY_CHIPS
  },
  play: async ({
    canvasElement
  }: {
    canvasElement: HTMLElement;
  }) => {
    const host = canvasElement.querySelector("annotation-chip-row") as HTMLElement;
    const handler = fn();
    host.addEventListener("dp-target-remove", handler);
    // Simulate dp-chip-remove bubbling from a child chip.
    const chipRow = host.shadowRoot!.querySelector(".context-chip-row")!;
    chipRow.dispatchEvent(new CustomEvent("dp-chip-remove", {
      detail: {
        type: "entity_id",
        itemId: "sensor.living_room_temp"
      },
      bubbles: true,
      composed: true
    }));
    await expect(handler).toHaveBeenCalledOnce();
    await expect((handler.mock.calls[0][0] as CustomEvent).detail.type).toBe("entity_id");
    await expect((handler.mock.calls[0][0] as CustomEvent).detail.id).toBe("sensor.living_room_temp");
  }
}`,...r.parameters?.docs?.source},description:{story:"Fires dp-target-remove when a chip's remove button is clicked.",...r.parameters?.docs?.description}}};const T=["Default","MixedTypes","SingleChip","Empty","EmitsTargetRemove"];export{t as Default,r as EmitsTargetRemove,n as Empty,o as MixedTypes,i as SingleChip,T as __namedExportsOrder,E as default};

import{b as w}from"./iframe-maWesKjk.js";import{f as v,w as u,u as g,e as p}from"./index-BVN6m9Ti.js";import"./comparison-tab-Blh0hT-9.js";import"./preload-helper-PPVm8Dsz.js";import"./property-DyW-YDBW.js";import"./class-map-pAsNZYN8.js";import"./directive-jorct-Oe.js";const k={title:"Molecules/Comparison Tab",component:"comparison-tab",parameters:{actions:{handles:["dp-tab-activate","dp-tab-hover","dp-tab-leave","dp-tab-edit","dp-tab-delete"]},docs:{description:{component:"`comparison-tab` renders a single tab in the chart comparison tab rail.\nIt supports active, previewing, loading, and editable states.\n\n@fires dp-tab-activate - `{ tabId: string }` fired when the tab trigger is clicked\n@fires dp-tab-hover - `{ tabId: string }` fired on mouseenter or trigger focus\n@fires dp-tab-leave - `{ tabId: string }` fired on mouseleave or trigger blur\n@fires dp-tab-edit - `{ tabId: string }` fired when the edit button is clicked (editable only)\n@fires dp-tab-delete - `{ tabId: string }` fired when the delete button is clicked (editable only)"}}},argTypes:{tabId:{control:"text",description:"Unique identifier for this tab; included in all event detail objects."},label:{control:"text",description:'Primary label shown in the tab (e.g. "Selected range" or a user-defined window name).'},detail:{control:"text",description:"Secondary detail text shown below the label (e.g. a formatted date range)."},active:{control:"boolean",description:"Whether this tab is the currently active date window."},previewing:{control:"boolean",description:"Whether the chart is currently previewing this tab's date range."},loading:{control:"boolean",description:"Whether this tab's data is currently loading."},editable:{control:"boolean",description:"Whether edit and delete action buttons are displayed."}},args:{tabId:"tab-1",label:"Selected range",detail:"1 Jan – 7 Jan 2025",active:!1,previewing:!1,loading:!1,editable:!1},render:e=>w`
    <div
      style="display: flex; align-items: flex-end; border-bottom: 1px solid rgba(255,255,255,0.12); padding: 0 16px;"
    >
      <comparison-tab
        .tabId=${e.tabId}
        .label=${e.label}
        .detail=${e.detail}
        .active=${e.active}
        .previewing=${e.previewing}
        .loading=${e.loading}
        .editable=${e.editable}
      ></comparison-tab>
    </div>
  `},n={},i={args:{active:!0}},r={args:{previewing:!0}},o={args:{loading:!0}},s={args:{tabId:"window-heating",label:"Heating season",detail:"1 Nov – 31 Mar",editable:!0}},d={args:{label:"Heating season",detail:"1 Nov – 31 Mar",active:!0,editable:!0}},c={args:{tabId:"tab-events",label:"Event tab",detail:"1 Jan – 7 Jan 2025"},play:async({canvasElement:e})=>{const t=e.querySelector("comparison-tab"),a=v();t.addEventListener("dp-tab-activate",a);const b=u(t.shadowRoot).getByRole("button",{name:/event tab/i});await g.click(b),await p(a).toHaveBeenCalledOnce(),await p(a.mock.calls[0][0].detail.tabId).toBe("tab-events")}},l={args:{tabId:"tab-editable",label:"My window",detail:"1 Jan – 7 Jan 2025",editable:!0},play:async({canvasElement:e})=>{const t=e.querySelector("comparison-tab"),a=v(),m=v();t.addEventListener("dp-tab-edit",a),t.addEventListener("dp-tab-delete",m);const b=u(t.shadowRoot);await g.click(b.getByRole("button",{name:/edit my window/i})),await p(a).toHaveBeenCalledOnce(),await g.click(b.getByRole("button",{name:/delete my window/i})),await p(m).toHaveBeenCalledOnce()}};n.parameters={...n.parameters,docs:{...n.parameters?.docs,source:{originalSource:"{}",...n.parameters?.docs?.source},description:{story:'Default inactive tab — "Selected range" with a date detail.',...n.parameters?.docs?.description}}};i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`{
  args: {
    active: true
  }
}`,...i.parameters?.docs?.source},description:{story:"Active tab — bold label and solid primary-color underline.",...i.parameters?.docs?.description}}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
  args: {
    previewing: true
  }
}`,...r.parameters?.docs?.source},description:{story:"Previewing tab — stronger underline tint, used when another tab is being hovered.",...r.parameters?.docs?.description}}};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  args: {
    loading: true
  }
}`,...o.parameters?.docs?.source},description:{story:"Loading tab — spinner icon and reduced opacity.",...o.parameters?.docs?.description}}};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  args: {
    tabId: "window-heating",
    label: "Heating season",
    detail: "1 Nov – 31 Mar",
    editable: true
  }
}`,...s.parameters?.docs?.source},description:{story:"Editable tab — shows edit (pencil) and delete (×) action buttons.",...s.parameters?.docs?.description}}};d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  args: {
    label: "Heating season",
    detail: "1 Nov – 31 Mar",
    active: true,
    editable: true
  }
}`,...d.parameters?.docs?.source},description:{story:"Active and editable — bold label, primary underline, and visible action buttons.",...d.parameters?.docs?.description}}};c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  args: {
    tabId: "tab-events",
    label: "Event tab",
    detail: "1 Jan – 7 Jan 2025"
  },
  play: async ({
    canvasElement
  }: {
    canvasElement: HTMLElement;
  }) => {
    const host = canvasElement.querySelector("comparison-tab") as HTMLElement;
    const handler = fn();
    host.addEventListener("dp-tab-activate", handler);
    const canvas = within(host.shadowRoot as unknown as HTMLElement);
    const trigger = canvas.getByRole("button", {
      name: /event tab/i
    });
    await userEvent.click(trigger);
    await expect(handler).toHaveBeenCalledOnce();
    await expect((handler.mock.calls[0][0] as CustomEvent).detail.tabId).toBe("tab-events");
  }
}`,...c.parameters?.docs?.source},description:{story:"Fires dp-tab-activate when the trigger button is clicked.",...c.parameters?.docs?.description}}};l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  args: {
    tabId: "tab-editable",
    label: "My window",
    detail: "1 Jan – 7 Jan 2025",
    editable: true
  },
  play: async ({
    canvasElement
  }: {
    canvasElement: HTMLElement;
  }) => {
    const host = canvasElement.querySelector("comparison-tab") as HTMLElement;
    const editHandler = fn();
    const deleteHandler = fn();
    host.addEventListener("dp-tab-edit", editHandler);
    host.addEventListener("dp-tab-delete", deleteHandler);
    const canvas = within(host.shadowRoot as unknown as HTMLElement);
    await userEvent.click(canvas.getByRole("button", {
      name: /edit my window/i
    }));
    await expect(editHandler).toHaveBeenCalledOnce();
    await userEvent.click(canvas.getByRole("button", {
      name: /delete my window/i
    }));
    await expect(deleteHandler).toHaveBeenCalledOnce();
  }
}`,...l.parameters?.docs?.source},description:{story:"Fires dp-tab-edit and dp-tab-delete when action buttons are clicked on an editable tab.",...l.parameters?.docs?.description}}};const x=["Default","Active","Previewing","Loading","Editable","ActiveEditable","EmitsActivate","EmitsEditAndDelete"];export{i as Active,d as ActiveEditable,n as Default,s as Editable,c as EmitsActivate,l as EmitsEditAndDelete,o as Loading,r as Previewing,x as __namedExportsOrder,k as default};

import{b as t}from"./iframe-maWesKjk.js";import"./range-handle-B7j9y8oM.js";import"./preload-helper-PPVm8Dsz.js";import"./property-DyW-YDBW.js";const l={title:"Atoms/Interactive/Range Handle",component:"range-handle",parameters:{actions:{handles:["dp-handle-drag-start","dp-handle-key-nudge","dp-handle-hover","dp-handle-leave","dp-handle-focus","dp-handle-blur"]},docs:{description:{component:`\`range-handle\` is a circular drag-handle button for a timeline range slider.
The parent owns positioning (\`style.left\`) and tooltip rendering; the handle fires
events for all pointer and keyboard interactions.

@fires dp-handle-drag-start - pointer down on handle
@fires dp-handle-key-nudge  - arrow key press
@fires dp-handle-hover      - pointer entered
@fires dp-handle-leave      - pointer left
@fires dp-handle-focus      - received focus
@fires dp-handle-blur       - lost focus`}}},argTypes:{position:{control:{type:"range",min:0,max:100,step:1}},label:{control:"text"},live:{control:"boolean"}},args:{position:30,label:"Start date and time",live:!1},render:r=>t`
    <div
      style="position: relative; height: 52px; background: var(--card-background-color); border-radius: 8px;"
    >
      <div
        style="
        position: absolute;
        left: 0; right: 0;
        top: 26px;
        height: 4px;
        border-radius: 999px;
        background: color-mix(in srgb, var(--primary-text-color, #111) 16%, transparent);
        transform: translateY(-50%);
      "
      ></div>
      <range-handle
        .position=${r.position}
        label="${r.label}"
        .live=${r.live}
      ></range-handle>
    </div>
  `},e={args:{position:30,label:"Start date and time",live:!1}},a={args:{position:70,label:"End date and time",live:!1}},n={args:{position:100,label:"End date and time (live)",live:!0}};e.parameters={...e.parameters,docs:{...e.parameters?.docs,source:{originalSource:`{
  args: {
    position: 30,
    label: "Start date and time",
    live: false
  }
}`,...e.parameters?.docs?.source}}};a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  args: {
    position: 70,
    label: "End date and time",
    live: false
  }
}`,...a.parameters?.docs?.source}}};n.parameters={...n.parameters,docs:{...n.parameters?.docs,source:{originalSource:`{
  args: {
    position: 100,
    label: "End date and time (live)",
    live: true
  }
}`,...n.parameters?.docs?.source}}};const p=["Default","EndHandle","LiveEdge"];export{e as Default,a as EndHandle,n as LiveEdge,p as __namedExportsOrder,l as default};

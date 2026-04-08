import{b as t}from"./iframe-maWesKjk.js";import"./sidebar-datapoint-display-section-BVNCUvw8.js";import"./preload-helper-PPVm8Dsz.js";import"./property-DyW-YDBW.js";import"./localize-Cz1ya3ms.js";import"./sidebar-options-section-XIovhKDU.js";import"./sidebar-section-header-CDFFctyZ.js";import"./checkbox-list-Z254-hxP.js";import"./localized-decorator-CXjGGqe_.js";const f={title:"Molecules/Sidebar Options/Datapoint Display Section",component:"sidebar-datapoint-display-section",parameters:{actions:{handles:["dp-display-change","dp-item-change"]},docs:{description:{component:'`sidebar-datapoint-display-section` renders the "Datapoint Display" sidebar section,\ncontrolling whether annotation datapoint icons and dotted lines are shown on the chart.\n\n@fires dp-display-change - `{ kind: string, value: boolean }` fired when a checkbox toggles'}}},argTypes:{showIcons:{control:"boolean",description:"Whether datapoint icons are rendered on the chart."},showLines:{control:"boolean",description:"Whether dotted lines are drawn for each datapoint."}},args:{showIcons:!0,showLines:!0},render:a=>t`
    <sidebar-datapoint-display-section
      .showIcons=${a.showIcons}
      .showLines=${a.showLines}
    ></sidebar-datapoint-display-section>
  `},s={},e={args:{showIcons:!1}},o={args:{showIcons:!1,showLines:!1}};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:"{}",...s.parameters?.docs?.source},description:{story:"Both icons and lines enabled — the default state.",...s.parameters?.docs?.description}}};e.parameters={...e.parameters,docs:{...e.parameters?.docs,source:{originalSource:`{
  args: {
    showIcons: false
  }
}`,...e.parameters?.docs?.source},description:{story:"Icons disabled, lines still on.",...e.parameters?.docs?.description}}};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  args: {
    showIcons: false,
    showLines: false
  }
}`,...o.parameters?.docs?.source},description:{story:"Both icons and lines disabled.",...o.parameters?.docs?.description}}};const w=["Default","IconsOff","AllOff"];export{o as AllOff,s as Default,e as IconsOff,w as __namedExportsOrder,f as default};

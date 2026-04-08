import{b as s}from"./iframe-maWesKjk.js";import"./sidebar-datapoints-section-DeEokyBI.js";import"./preload-helper-PPVm8Dsz.js";import"./property-DyW-YDBW.js";import"./localize-Cz1ya3ms.js";import"./sidebar-options-section-XIovhKDU.js";import"./sidebar-section-header-CDFFctyZ.js";import"./radio-group-CFoLmpSs.js";import"./localized-decorator-CXjGGqe_.js";const S={title:"Molecules/Sidebar Options/Datapoints Section",component:"sidebar-datapoints-section",parameters:{actions:{handles:["dp-scope-change","dp-radio-change"]},docs:{description:{component:'`sidebar-datapoints-section` renders the "Datapoints" sidebar section,\nletting the user choose which annotation datapoints appear on the chart.\n\n@fires dp-scope-change - `{ value: string }` fired when the selected scope radio changes'}}},argTypes:{datapointScope:{control:"select",options:["linked","all","hidden"],description:'Which annotation datapoints appear on the chart. One of "linked", "all", or "hidden".'}},args:{datapointScope:"linked"},render:a=>s`
    <sidebar-datapoints-section
      .datapointScope=${a.datapointScope}
    ></sidebar-datapoints-section>
  `},e={},o={args:{datapointScope:"all"}},t={args:{datapointScope:"hidden"}};e.parameters={...e.parameters,docs:{...e.parameters?.docs,source:{originalSource:"{}",...e.parameters?.docs?.source},description:{story:"Scope set to linked — only datapoints tied to selected targets are shown.",...e.parameters?.docs?.description}}};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  args: {
    datapointScope: "all"
  }
}`,...o.parameters?.docs?.source},description:{story:"Scope set to all — every datapoint regardless of target selection.",...o.parameters?.docs?.description}}};t.parameters={...t.parameters,docs:{...t.parameters?.docs,source:{originalSource:`{
  args: {
    datapointScope: "hidden"
  }
}`,...t.parameters?.docs?.source},description:{story:"Scope set to hidden — datapoints are not shown on the chart.",...t.parameters?.docs?.description}}};const g=["ScopeLinked","ScopeAll","ScopeHidden"];export{o as ScopeAll,t as ScopeHidden,e as ScopeLinked,g as __namedExportsOrder,S as default};

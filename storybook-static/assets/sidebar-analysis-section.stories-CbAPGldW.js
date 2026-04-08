import{b as s}from"./iframe-maWesKjk.js";import"./sidebar-analysis-section-1WlU2LBc.js";import"./preload-helper-PPVm8Dsz.js";import"./property-DyW-YDBW.js";import"./localize-Cz1ya3ms.js";import"./sidebar-options-section-XIovhKDU.js";import"./sidebar-section-header-CDFFctyZ.js";import"./checkbox-list-Z254-hxP.js";import"./radio-group-CFoLmpSs.js";import"./localized-decorator-CXjGGqe_.js";const b={title:"Molecules/Sidebar Options/Analysis Section",component:"sidebar-analysis-section",parameters:{actions:{handles:["dp-analysis-change","dp-display-change","dp-item-change","dp-radio-change"]}},argTypes:{anomalyOverlapMode:{control:"select",options:["all","only"]},showCorrelatedAnomalies:{control:"boolean"},anyAnomaliesEnabled:{control:"boolean"}},args:{anomalyOverlapMode:"all",showCorrelatedAnomalies:!0,anyAnomaliesEnabled:!0},render:o=>s`
    <sidebar-analysis-section
      .anomalyOverlapMode=${o.anomalyOverlapMode}
      .showCorrelatedAnomalies=${o.showCorrelatedAnomalies}
      .anyAnomaliesEnabled=${o.anyAnomaliesEnabled}
    ></sidebar-analysis-section>
  `},e={},a={args:{anyAnomaliesEnabled:!1,showCorrelatedAnomalies:!1}};e.parameters={...e.parameters,docs:{...e.parameters?.docs,source:{originalSource:"{}",...e.parameters?.docs?.source}}};a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  args: {
    anyAnomaliesEnabled: false,
    showCorrelatedAnomalies: false
  }
}`,...a.parameters?.docs?.source}}};const A=["Default","DisabledUntilAnomaliesEnabled"];export{e as Default,a as DisabledUntilAnomaliesEnabled,A as __namedExportsOrder,b as default};

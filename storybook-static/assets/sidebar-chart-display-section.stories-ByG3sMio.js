import{b as i}from"./iframe-maWesKjk.js";import"./sidebar-chart-display-section-Csv-EgI1.js";import"./preload-helper-PPVm8Dsz.js";import"./property-DyW-YDBW.js";import"./localize-Cz1ya3ms.js";import"./sidebar-options-section-XIovhKDU.js";import"./sidebar-section-header-CDFFctyZ.js";import"./checkbox-list-Z254-hxP.js";import"./radio-group-CFoLmpSs.js";import"./localized-decorator-CXjGGqe_.js";const y={title:"Molecules/Sidebar Options/Chart Display Section",component:"sidebar-chart-display-section",parameters:{actions:{handles:["dp-display-change","dp-item-change","dp-radio-change"]},docs:{description:{component:'`sidebar-chart-display-section` renders the "Chart Display" sidebar section,\ngrouping chart visual options: tooltips, hover guides, data gaps\n(with a dependent gap-threshold select), and y-axis layout mode.\n\n@fires dp-display-change - `{ kind: string, value: boolean | string }` fired when any option changes'}}},argTypes:{showTooltips:{control:"boolean",description:"Whether chart tooltips are shown on hover."},showHoverGuides:{control:"boolean",description:"Whether hover guide lines are emphasized."},hoverSnapMode:{control:"select",options:["follow_series","snap_to_data_points"],description:"Whether hover follows the interpolated series or snaps to actual datapoints."},showDataGaps:{control:"boolean",description:"Whether data gaps are visually indicated. When false the gap threshold select is disabled."},dataGapThreshold:{control:"select",options:["auto","5m","15m","1h","2h","3h","6h","12h","24h"],description:"Minimum gap duration treated as a data gap. Active only when showDataGaps is true."},yAxisMode:{control:"select",options:["combined","unique","split"],description:'Y-axis layout: "combined" groups by unit, "unique" gives each series its own axis, "split" renders rows.'}},args:{showTooltips:!0,showHoverGuides:!1,hoverSnapMode:"follow_series",showDataGaps:!0,dataGapThreshold:"2h",yAxisMode:"combined"},render:e=>i`
    <sidebar-chart-display-section
      .showTooltips=${e.showTooltips}
      .showHoverGuides=${e.showHoverGuides}
      .hoverSnapMode=${e.hoverSnapMode}
      .showDataGaps=${e.showDataGaps}
      .dataGapThreshold=${e.dataGapThreshold}
      .yAxisMode=${e.yAxisMode}
    ></sidebar-chart-display-section>
  `},s={},o={args:{showDataGaps:!1}},a={args:{showTooltips:!0,showHoverGuides:!0,hoverSnapMode:"snap_to_data_points",showDataGaps:!0,dataGapThreshold:"1h"}},t={args:{yAxisMode:"unique"}},r={args:{yAxisMode:"split"}};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:"{}",...s.parameters?.docs?.source},description:{story:"Default state — tooltips on, data gaps on, y-axis combined.",...s.parameters?.docs?.description}}};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  args: {
    showDataGaps: false
  }
}`,...o.parameters?.docs?.source},description:{story:"Data gaps off — the gap threshold select is disabled and dimmed.",...o.parameters?.docs?.description}}};a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  args: {
    showTooltips: true,
    showHoverGuides: true,
    hoverSnapMode: "snap_to_data_points",
    showDataGaps: true,
    dataGapThreshold: "1h"
  }
}`,...a.parameters?.docs?.source},description:{story:"All chart display checkboxes enabled.",...a.parameters?.docs?.description}}};t.parameters={...t.parameters,docs:{...t.parameters?.docs,source:{originalSource:`{
  args: {
    yAxisMode: "unique"
  }
}`,...t.parameters?.docs?.source},description:{story:"Y-axis set to unique — each series gets its own axis.",...t.parameters?.docs?.description}}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
  args: {
    yAxisMode: "split"
  }
}`,...r.parameters?.docs?.source},description:{story:"Y-axis set to split — each series rendered in its own chart row.",...r.parameters?.docs?.description}}};const x=["Default","DataGapsOff","AllCheckboxesOn","YAxisUnique","YAxisSplit"];export{a as AllCheckboxesOn,o as DataGapsOff,s as Default,r as YAxisSplit,t as YAxisUnique,x as __namedExportsOrder,y as default};

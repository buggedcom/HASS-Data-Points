import{b as s}from"./iframe-maWesKjk.js";import"./analysis-rate-group-ClWjzN4_.js";import"./preload-helper-PPVm8Dsz.js";import"./property-DyW-YDBW.js";import"./localize-Cz1ya3ms.js";import"./analysis-group-shared.styles-Cw1nMqQy.js";import"./analysis-group-ZyfAZWsO.js";import"./localized-decorator-CXjGGqe_.js";const p={title:"Molecules/Analysis/Rate Group",component:"analysis-rate-group",parameters:{actions:{handles:["dp-group-analysis-change"]}}};function r(o={}){return{expanded:!1,show_trend_lines:!1,trend_method:"rolling_average",trend_window:"24h",show_trend_crosshairs:!1,show_summary_stats:!1,show_summary_stats_shading:!1,show_rate_of_change:!1,show_rate_crosshairs:!1,rate_window:"1h",show_threshold_analysis:!1,show_threshold_shading:!1,threshold_value:"",threshold_direction:"above",show_anomalies:!1,anomaly_methods:[],anomaly_overlap_mode:"all",anomaly_sensitivity:"medium",anomaly_rate_window:"1h",anomaly_zscore_window:"24h",anomaly_persistence_window:"1h",anomaly_comparison_window_id:null,show_delta_analysis:!1,show_delta_tooltip:!1,show_delta_lines:!1,hide_source_series:!1,sample_interval:"raw",sample_aggregate:"mean",anomaly_use_sampled_data:!1,...o}}const a={render:()=>s`
    <analysis-rate-group
      .analysis=${r()}
      .entityId=${"sensor.temperature"}
    ></analysis-rate-group>
  `},e={render:()=>s`
    <analysis-rate-group
      .analysis=${r({show_rate_of_change:!0,rate_window:"6h"})}
      .entityId=${"sensor.temperature"}
    ></analysis-rate-group>
  `};a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  render: () => html\`
    <analysis-rate-group
      .analysis=\${makeAnalysis()}
      .entityId=\${"sensor.temperature"}
    ></analysis-rate-group>
  \`
}`,...a.parameters?.docs?.source}}};e.parameters={...e.parameters,docs:{...e.parameters?.docs,source:{originalSource:`{
  render: () => html\`
    <analysis-rate-group
      .analysis=\${makeAnalysis({
    show_rate_of_change: true,
    rate_window: "6h"
  })}
      .entityId=\${"sensor.temperature"}
    ></analysis-rate-group>
  \`
}`,...e.parameters?.docs?.source}}};const u=["Default","Checked"];export{e as Checked,a as Default,u as __namedExportsOrder,p as default};

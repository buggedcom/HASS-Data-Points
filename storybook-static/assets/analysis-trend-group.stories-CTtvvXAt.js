import{b as r}from"./iframe-maWesKjk.js";import"./analysis-trend-group-C_jadOVq.js";import"./preload-helper-PPVm8Dsz.js";import"./property-DyW-YDBW.js";import"./localize-Cz1ya3ms.js";import"./analysis-group-shared.styles-Cw1nMqQy.js";import"./analysis-group-ZyfAZWsO.js";import"./localized-decorator-CXjGGqe_.js";const u={title:"Molecules/Analysis/Trend Group",component:"analysis-trend-group",parameters:{actions:{handles:["dp-group-analysis-change"]}}};function n(t={}){return{expanded:!1,show_trend_lines:!1,trend_method:"rolling_average",trend_window:"24h",show_trend_crosshairs:!1,show_summary_stats:!1,show_summary_stats_shading:!1,show_rate_of_change:!1,show_rate_crosshairs:!1,rate_window:"1h",show_threshold_analysis:!1,show_threshold_shading:!1,threshold_value:"",threshold_direction:"above",show_anomalies:!1,anomaly_methods:[],anomaly_overlap_mode:"all",anomaly_sensitivity:"medium",anomaly_rate_window:"1h",anomaly_zscore_window:"24h",anomaly_persistence_window:"1h",anomaly_comparison_window_id:null,show_delta_analysis:!1,show_delta_tooltip:!1,show_delta_lines:!1,hide_source_series:!1,sample_interval:"raw",sample_aggregate:"mean",anomaly_use_sampled_data:!1,...t}}const e={render:()=>r`
    <analysis-trend-group
      .analysis=${n()}
      .entityId=${"sensor.temperature"}
    ></analysis-trend-group>
  `},s={render:()=>r`
    <analysis-trend-group
      .analysis=${n({show_trend_lines:!0,trend_method:"rolling_average",trend_window:"24h"})}
      .entityId=${"sensor.temperature"}
    ></analysis-trend-group>
  `},a={render:()=>r`
    <analysis-trend-group
      .analysis=${n({show_trend_lines:!0,trend_method:"linear_trend"})}
      .entityId=${"sensor.temperature"}
    ></analysis-trend-group>
  `};e.parameters={...e.parameters,docs:{...e.parameters?.docs,source:{originalSource:`{
  render: () => html\`
    <analysis-trend-group
      .analysis=\${makeAnalysis()}
      .entityId=\${"sensor.temperature"}
    ></analysis-trend-group>
  \`
}`,...e.parameters?.docs?.source}}};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  render: () => html\`
    <analysis-trend-group
      .analysis=\${makeAnalysis({
    show_trend_lines: true,
    trend_method: "rolling_average",
    trend_window: "24h"
  })}
      .entityId=\${"sensor.temperature"}
    ></analysis-trend-group>
  \`
}`,...s.parameters?.docs?.source}}};a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  render: () => html\`
    <analysis-trend-group
      .analysis=\${makeAnalysis({
    show_trend_lines: true,
    trend_method: "linear_trend"
  })}
      .entityId=\${"sensor.temperature"}
    ></analysis-trend-group>
  \`
}`,...a.parameters?.docs?.source}}};const y=["Default","Checked","CheckedLinearTrend"];export{s as Checked,a as CheckedLinearTrend,e as Default,y as __namedExportsOrder,u as default};

import{b as r}from"./iframe-maWesKjk.js";import"./analysis-threshold-group-CvkzLvvQ.js";import"./preload-helper-PPVm8Dsz.js";import"./property-DyW-YDBW.js";import"./localize-Cz1ya3ms.js";import"./analysis-group-shared.styles-Cw1nMqQy.js";import"./analysis-group-ZyfAZWsO.js";import"./localized-decorator-CXjGGqe_.js";const p={title:"Molecules/Analysis/Threshold Group",component:"analysis-threshold-group",parameters:{actions:{handles:["dp-group-analysis-change"]}}};function o(n={}){return{expanded:!1,show_trend_lines:!1,trend_method:"rolling_average",trend_window:"24h",show_trend_crosshairs:!1,show_summary_stats:!1,show_summary_stats_shading:!1,show_rate_of_change:!1,show_rate_crosshairs:!1,rate_window:"1h",show_threshold_analysis:!1,show_threshold_shading:!1,threshold_value:"",threshold_direction:"above",show_anomalies:!1,anomaly_methods:[],anomaly_overlap_mode:"all",anomaly_sensitivity:"medium",anomaly_rate_window:"1h",anomaly_zscore_window:"24h",anomaly_persistence_window:"1h",anomaly_comparison_window_id:null,show_delta_analysis:!1,show_delta_tooltip:!1,show_delta_lines:!1,hide_source_series:!1,sample_interval:"raw",sample_aggregate:"mean",anomaly_use_sampled_data:!1,...n}}const s={render:()=>r`
    <analysis-threshold-group
      .analysis=${o()}
      .entityId=${"sensor.temperature"}
      .unit=${"°C"}
    ></analysis-threshold-group>
  `},e={render:()=>r`
    <analysis-threshold-group
      .analysis=${o({show_threshold_analysis:!0,threshold_value:"25",threshold_direction:"above"})}
      .entityId=${"sensor.temperature"}
      .unit=${"°C"}
    ></analysis-threshold-group>
  `},a={render:()=>r`
    <analysis-threshold-group
      .analysis=${o({show_threshold_analysis:!0,show_threshold_shading:!0,threshold_value:"25",threshold_direction:"above"})}
      .entityId=${"sensor.temperature"}
      .unit=${"°C"}
    ></analysis-threshold-group>
  `};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  render: () => html\`
    <analysis-threshold-group
      .analysis=\${makeAnalysis()}
      .entityId=\${"sensor.temperature"}
      .unit=\${"°C"}
    ></analysis-threshold-group>
  \`
}`,...s.parameters?.docs?.source}}};e.parameters={...e.parameters,docs:{...e.parameters?.docs,source:{originalSource:`{
  render: () => html\`
    <analysis-threshold-group
      .analysis=\${makeAnalysis({
    show_threshold_analysis: true,
    threshold_value: "25",
    threshold_direction: "above"
  })}
      .entityId=\${"sensor.temperature"}
      .unit=\${"°C"}
    ></analysis-threshold-group>
  \`
}`,...e.parameters?.docs?.source}}};a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  render: () => html\`
    <analysis-threshold-group
      .analysis=\${makeAnalysis({
    show_threshold_analysis: true,
    show_threshold_shading: true,
    threshold_value: "25",
    threshold_direction: "above"
  })}
      .entityId=\${"sensor.temperature"}
      .unit=\${"°C"}
    ></analysis-threshold-group>
  \`
}`,...a.parameters?.docs?.source}}};const y=["Default","Checked","CheckedWithShading"];export{e as Checked,a as CheckedWithShading,s as Default,y as __namedExportsOrder,p as default};

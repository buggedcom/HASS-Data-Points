import{b as r}from"./iframe-maWesKjk.js";import"./analysis-sample-group-B6DXKU1N.js";import"./preload-helper-PPVm8Dsz.js";import"./property-DyW-YDBW.js";import"./localize-Cz1ya3ms.js";import"./analysis-group-shared.styles-Cw1nMqQy.js";import"./analysis-group-ZyfAZWsO.js";import"./localized-decorator-CXjGGqe_.js";const y={title:"Molecules/Analysis/Sample Group",component:"analysis-sample-group",parameters:{actions:{handles:["dp-group-analysis-change"]}}};function n(l={}){return{expanded:!1,show_trend_lines:!1,trend_method:"rolling_average",trend_window:"24h",show_trend_crosshairs:!1,show_summary_stats:!1,show_summary_stats_shading:!1,show_rate_of_change:!1,show_rate_crosshairs:!1,rate_window:"1h",show_threshold_analysis:!1,show_threshold_shading:!1,threshold_value:"",threshold_direction:"above",show_anomalies:!1,anomaly_methods:[],anomaly_overlap_mode:"all",anomaly_sensitivity:"medium",anomaly_rate_window:"1h",anomaly_zscore_window:"24h",anomaly_persistence_window:"1h",anomaly_comparison_window_id:null,show_delta_analysis:!1,show_delta_tooltip:!1,show_delta_lines:!1,hide_source_series:!1,sample_interval:"raw",sample_aggregate:"mean",anomaly_use_sampled_data:!0,...l}}const a={render:()=>r`
    <analysis-sample-group
      .analysis=${n({sample_interval:"raw"})}
      .entityId=${"sensor.temperature"}
    ></analysis-sample-group>
  `},e={render:()=>r`
    <analysis-sample-group
      .analysis=${n({sample_interval:"1m",sample_aggregate:"mean"})}
      .entityId=${"sensor.temperature"}
    ></analysis-sample-group>
  `},s={render:()=>r`
    <analysis-sample-group
      .analysis=${n({sample_interval:"24h",sample_aggregate:"mean"})}
      .entityId=${"sensor.temperature"}
    ></analysis-sample-group>
  `};a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  render: () => html\`
    <analysis-sample-group
      .analysis=\${makeAnalysis({
    sample_interval: "raw"
  })}
      .entityId=\${"sensor.temperature"}
    ></analysis-sample-group>
  \`
}`,...a.parameters?.docs?.source}}};e.parameters={...e.parameters,docs:{...e.parameters?.docs,source:{originalSource:`{
  render: () => html\`
    <analysis-sample-group
      .analysis=\${makeAnalysis({
    sample_interval: "1m",
    sample_aggregate: "mean"
  })}
      .entityId=\${"sensor.temperature"}
    ></analysis-sample-group>
  \`
}`,...e.parameters?.docs?.source}}};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  render: () => html\`
    <analysis-sample-group
      .analysis=\${makeAnalysis({
    sample_interval: "24h",
    sample_aggregate: "mean"
  })}
      .entityId=\${"sensor.temperature"}
    ></analysis-sample-group>
  \`
}`,...s.parameters?.docs?.source}}};const h=["Default","WithInterval","CoarseInterval"];export{s as CoarseInterval,a as Default,e as WithInterval,h as __namedExportsOrder,y as default};

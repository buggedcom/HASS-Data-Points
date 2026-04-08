import{b as r}from"./iframe-maWesKjk.js";import"./analysis-delta-group-COrtQ8Ee.js";import"./preload-helper-PPVm8Dsz.js";import"./property-DyW-YDBW.js";import"./localize-Cz1ya3ms.js";import"./analysis-group-shared.styles-Cw1nMqQy.js";import"./analysis-group-ZyfAZWsO.js";import"./localized-decorator-CXjGGqe_.js";const c={title:"Molecules/Analysis/Delta Group",component:"analysis-delta-group",parameters:{actions:{handles:["dp-group-analysis-change"]}}};function t(l={}){return{expanded:!1,show_trend_lines:!1,trend_method:"rolling_average",trend_window:"24h",show_trend_crosshairs:!1,show_summary_stats:!1,show_summary_stats_shading:!1,show_rate_of_change:!1,show_rate_crosshairs:!1,rate_window:"1h",show_threshold_analysis:!1,show_threshold_shading:!1,threshold_value:"",threshold_direction:"above",show_anomalies:!1,anomaly_methods:[],anomaly_overlap_mode:"all",anomaly_sensitivity:"medium",anomaly_rate_window:"1h",anomaly_zscore_window:"24h",anomaly_persistence_window:"1h",anomaly_comparison_window_id:null,show_delta_analysis:!1,show_delta_tooltip:!1,show_delta_lines:!1,hide_source_series:!1,sample_interval:"raw",sample_aggregate:"mean",anomaly_use_sampled_data:!1,...l}}const a={render:()=>r`
    <analysis-delta-group
      .analysis=${t()}
      .entityId=${"sensor.temperature"}
      .canShowDeltaAnalysis=${!1}
    ></analysis-delta-group>
  `},e={render:()=>r`
    <analysis-delta-group
      .analysis=${t()}
      .entityId=${"sensor.temperature"}
      .canShowDeltaAnalysis=${!1}
    ></analysis-delta-group>
  `},s={render:()=>r`
    <analysis-delta-group
      .analysis=${t()}
      .entityId=${"sensor.temperature"}
      .canShowDeltaAnalysis=${!0}
    ></analysis-delta-group>
  `},n={render:()=>r`
    <analysis-delta-group
      .analysis=${t({show_delta_analysis:!0,show_delta_tooltip:!0})}
      .entityId=${"sensor.temperature"}
      .canShowDeltaAnalysis=${!0}
    ></analysis-delta-group>
  `};a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  render: () => html\`
    <analysis-delta-group
      .analysis=\${makeAnalysis()}
      .entityId=\${"sensor.temperature"}
      .canShowDeltaAnalysis=\${false}
    ></analysis-delta-group>
  \`
}`,...a.parameters?.docs?.source}}};e.parameters={...e.parameters,docs:{...e.parameters?.docs,source:{originalSource:`{
  render: () => html\`
    <analysis-delta-group
      .analysis=\${makeAnalysis()}
      .entityId=\${"sensor.temperature"}
      .canShowDeltaAnalysis=\${false}
    ></analysis-delta-group>
  \`
}`,...e.parameters?.docs?.source}}};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  render: () => html\`
    <analysis-delta-group
      .analysis=\${makeAnalysis()}
      .entityId=\${"sensor.temperature"}
      .canShowDeltaAnalysis=\${true}
    ></analysis-delta-group>
  \`
}`,...s.parameters?.docs?.source}}};n.parameters={...n.parameters,docs:{...n.parameters?.docs,source:{originalSource:`{
  render: () => html\`
    <analysis-delta-group
      .analysis=\${makeAnalysis({
    show_delta_analysis: true,
    show_delta_tooltip: true
  })}
      .entityId=\${"sensor.temperature"}
      .canShowDeltaAnalysis=\${true}
    ></analysis-delta-group>
  \`
}`,...n.parameters?.docs?.source}}};const h=["Default","Disabled","Enabled","Checked"];export{n as Checked,a as Default,e as Disabled,s as Enabled,h as __namedExportsOrder,c as default};

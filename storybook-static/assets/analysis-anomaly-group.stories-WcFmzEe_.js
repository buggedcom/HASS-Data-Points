import{b as l}from"./iframe-maWesKjk.js";import{e}from"./index-BVN6m9Ti.js";import"./analysis-anomaly-group-COJBbfcf.js";import{s as y}from"./localize-Cz1ya3ms.js";import"./preload-helper-PPVm8Dsz.js";import"./property-DyW-YDBW.js";import"./analysis-group-shared.styles-Cw1nMqQy.js";import"./analysis-group-ZyfAZWsO.js";import"./analysis-method-subopts-INTT52YI.js";import"./localized-decorator-CXjGGqe_.js";const v={title:"Molecules/Analysis/Anomaly Group",component:"analysis-anomaly-group",parameters:{actions:{handles:["dp-group-analysis-change"]}},loaders:[async()=>(await y("en"),{})]};function i(n={}){return{expanded:!1,show_trend_lines:!1,trend_method:"rolling_average",trend_window:"24h",show_trend_crosshairs:!1,show_summary_stats:!1,show_summary_stats_shading:!1,show_rate_of_change:!1,show_rate_crosshairs:!1,rate_window:"1h",show_threshold_analysis:!1,show_threshold_shading:!1,threshold_value:"",threshold_direction:"above",show_anomalies:!1,anomaly_methods:[],anomaly_overlap_mode:"all",anomaly_sensitivity:"medium",anomaly_rate_window:"1h",anomaly_zscore_window:"24h",anomaly_persistence_window:"1h",anomaly_comparison_window_id:null,show_delta_analysis:!1,show_delta_tooltip:!1,show_delta_lines:!1,hide_source_series:!1,sample_interval:"raw",sample_aggregate:"mean",anomaly_use_sampled_data:!1,...n}}const m=[{id:"last-week",label:"Last week"},{id:"last-month",label:"Last month"}],o={render:()=>l`
    <analysis-anomaly-group
      .analysis=${i()}
      .entityId=${"sensor.temperature"}
      .comparisonWindows=${m}
    ></analysis-anomaly-group>
  `},s={render:()=>l`
    <analysis-anomaly-group
      .analysis=${i({show_anomalies:!0,anomaly_methods:["iqr"],anomaly_sensitivity:"medium"})}
      .entityId=${"sensor.temperature"}
      .comparisonWindows=${m}
    ></analysis-anomaly-group>
  `,play:async({canvasElement:n})=>{const a=n.querySelector("analysis-anomaly-group");e(a.shadowRoot.querySelector('ha-tooltip[for="anomaly-help-iqr"]')).toBeTruthy(),e(a.shadowRoot.textContent).toContain("Statistical outlier")}},t={render:()=>l`
    <analysis-anomaly-group
      .analysis=${i({show_anomalies:!0,anomaly_methods:["iqr","rolling_zscore"],anomaly_sensitivity:"high",anomaly_overlap_mode:"only"})}
      .entityId=${"sensor.temperature"}
      .comparisonWindows=${m}
    ></analysis-anomaly-group>
  `},r={loaders:[async()=>(await y("fi"),{})],render:()=>l`
    <analysis-anomaly-group
      .analysis=${i({show_anomalies:!0,anomaly_methods:["iqr"],anomaly_sensitivity:"medium"})}
      .entityId=${"sensor.temperature"}
      .comparisonWindows=${m}
    ></analysis-anomaly-group>
  `,play:async({canvasElement:n})=>{const a=n.querySelector("analysis-anomaly-group");e(a.analysis.show_anomalies).toBe(!0),e(a.shadowRoot.textContent).toContain("Herkkyys"),e(a.shadowRoot.textContent).toContain("Tilastollinen poikkeama")}};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  render: () => html\`
    <analysis-anomaly-group
      .analysis=\${makeAnalysis()}
      .entityId=\${"sensor.temperature"}
      .comparisonWindows=\${comparisonWindows}
    ></analysis-anomaly-group>
  \`
}`,...o.parameters?.docs?.source}}};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  render: () => html\`
    <analysis-anomaly-group
      .analysis=\${makeAnalysis({
    show_anomalies: true,
    anomaly_methods: ["iqr"],
    anomaly_sensitivity: "medium"
  })}
      .entityId=\${"sensor.temperature"}
      .comparisonWindows=\${comparisonWindows}
    ></analysis-anomaly-group>
  \`,
  play: async ({
    canvasElement
  }: {
    canvasElement: HTMLElement;
  }) => {
    const el = canvasElement.querySelector("analysis-anomaly-group") as HTMLElement & {
      shadowRoot: ShadowRoot;
      analysis: NormalizedAnalysis;
    };
    expect(el.shadowRoot.querySelector('ha-tooltip[for="anomaly-help-iqr"]')).toBeTruthy();
    expect(el.shadowRoot.textContent).toContain("Statistical outlier");
  }
}`,...s.parameters?.docs?.source}}};t.parameters={...t.parameters,docs:{...t.parameters?.docs,source:{originalSource:`{
  render: () => html\`
    <analysis-anomaly-group
      .analysis=\${makeAnalysis({
    show_anomalies: true,
    anomaly_methods: ["iqr", "rolling_zscore"],
    anomaly_sensitivity: "high",
    anomaly_overlap_mode: "only"
  })}
      .entityId=\${"sensor.temperature"}
      .comparisonWindows=\${comparisonWindows}
    ></analysis-anomaly-group>
  \`
}`,...t.parameters?.docs?.source}}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
  loaders: [async () => {
    await setFrontendLocale("fi");
    return {};
  }],
  render: () => html\`
    <analysis-anomaly-group
      .analysis=\${makeAnalysis({
    show_anomalies: true,
    anomaly_methods: ["iqr"],
    anomaly_sensitivity: "medium"
  })}
      .entityId=\${"sensor.temperature"}
      .comparisonWindows=\${comparisonWindows}
    ></analysis-anomaly-group>
  \`,
  play: async ({
    canvasElement
  }: {
    canvasElement: HTMLElement;
  }) => {
    const el = canvasElement.querySelector("analysis-anomaly-group") as HTMLElement & {
      shadowRoot: ShadowRoot;
      analysis: NormalizedAnalysis;
    };
    expect(el.analysis.show_anomalies).toBe(true);
    expect(el.shadowRoot.textContent).toContain("Herkkyys");
    expect(el.shadowRoot.textContent).toContain("Tilastollinen poikkeama");
  }
}`,...r.parameters?.docs?.source}}};const k=["Default","Checked","CheckedWithMultipleMethods","Finnish"];export{s as Checked,t as CheckedWithMultipleMethods,o as Default,r as Finnish,k as __namedExportsOrder,v as default};

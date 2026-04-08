import{b as f}from"./iframe-maWesKjk.js";import{e as t,f as v,u as b}from"./index-BVN6m9Ti.js";import"./target-row-CqKWU3NH.js";import"./preload-helper-PPVm8Dsz.js";import"./property-DyW-YDBW.js";import"./localize-Cz1ya3ms.js";import"./analysis-sample-group-B6DXKU1N.js";import"./analysis-group-shared.styles-Cw1nMqQy.js";import"./analysis-group-ZyfAZWsO.js";import"./localized-decorator-CXjGGqe_.js";import"./analysis-trend-group-C_jadOVq.js";import"./analysis-summary-group-18mMfsol.js";import"./analysis-rate-group-ClWjzN4_.js";import"./analysis-threshold-group-CvkzLvvQ.js";import"./analysis-anomaly-group-COJBbfcf.js";import"./analysis-method-subopts-INTT52YI.js";import"./analysis-delta-group-COrtQ8Ee.js";async function o(n){const s=n.querySelector("target-row");return await s.updateComplete,s}const r={expanded:!1,show_trend_lines:!1,trend_method:"rolling_average",trend_window:"24h",show_trend_crosshairs:!1,show_summary_stats:!1,show_summary_stats_shading:!1,show_rate_of_change:!1,show_rate_crosshairs:!1,rate_window:"1h",show_threshold_analysis:!1,show_threshold_shading:!1,threshold_value:"",threshold_direction:"above",show_anomalies:!1,anomaly_methods:[],anomaly_overlap_mode:"all",anomaly_sensitivity:"medium",anomaly_rate_window:"1h",anomaly_zscore_window:"24h",anomaly_persistence_window:"1h",anomaly_comparison_window_id:null,show_delta_analysis:!1,show_delta_tooltip:!0,show_delta_lines:!1,hide_source_series:!1,sample_interval:"raw",sample_aggregate:"mean",anomaly_use_sampled_data:!1},x={entity_id:"sensor.living_room_temperature",state:"21.5",attributes:{friendly_name:"Living Room Temperature",unit_of_measurement:"°C",icon:"mdi:thermometer",device_class:"temperature"},last_changed:"2024-01-01T00:00:00.000Z",last_updated:"2024-01-01T00:00:00.000Z",context:{id:"abc123",parent_id:null,user_id:null}},E={...r,expanded:!0,show_trend_lines:!0,trend_method:"rolling_average",trend_window:"24h",show_trend_crosshairs:!0,show_summary_stats:!0,show_anomalies:!0,anomaly_methods:["trend_residual","rolling_zscore"],anomaly_sensitivity:"medium",anomaly_zscore_window:"24h",anomaly_overlap_mode:"only"},G={title:"Molecules/Target Row",component:"target-row",parameters:{actions:{handles:["dp-row-color-change","dp-row-visibility-change","dp-row-toggle-analysis","dp-row-remove","dp-row-analysis-change"]},docs:{description:{component:"`target-row` is a single entity row in the history panel sidebar.\nIt shows the entity's name, color swatch, visibility toggle, and an optional\nexpandable analysis panel with trend, threshold, anomaly, and delta options.\n\n@fires dp-row-color-change - `{ index, color }` — user changes the swatch color\n@fires dp-row-visibility-change - `{ entityId, visible }` — user toggles row on/off\n@fires dp-row-toggle-analysis - `{ entityId }` — user opens/closes the analysis panel\n@fires dp-row-remove - `{ index }` — user removes the row\n@fires dp-row-analysis-change - `{ entityId, key, value }` — user changes an analysis option"}}},argTypes:{color:{control:"color",description:"Hex color for the series line and swatch"},visible:{control:"boolean",description:"Whether the series is shown on the chart — controls the toggle state and `is-hidden` opacity"},canShowDeltaAnalysis:{control:"boolean",description:"Enable delta analysis options (requires a comparison date window to be active)"},stateObj:{control:"object",description:"HA entity state object from `hass.states`. Provides the display name (`attributes.friendly_name`), unit (`attributes.unit_of_measurement`), and icon for `ha-state-icon`."},index:{control:"number",description:"Zero-based position of this row in the list — included in `dp-row-remove` and `dp-row-color-change` events"},analysis:{control:"object",description:"Normalized analysis config object with all analysis settings as a flat record. The `expanded` field controls whether the analysis panel is open."},comparisonWindows:{control:"object",description:"Array of `{ id, label? }` date windows available for comparison / delta analysis"}},args:{color:"#03a9f4",visible:!0,analysis:r,index:0,canShowDeltaAnalysis:!1,stateObj:x,comparisonWindows:[]},render:n=>f`
    <div style="max-width: 600px;">
      <target-row
        .color=${n.color}
        .visible=${n.visible}
        .analysis=${n.analysis}
        .index=${n.index}
        .canShowDeltaAnalysis=${n.canShowDeltaAnalysis}
        .stateObj=${n.stateObj}
        .comparisonWindows=${n.comparisonWindows}
      ></target-row>
    </div>
  `},l={play:async({canvasElement:n})=>{const e=(await o(n)).shadowRoot;t(e.querySelector(".history-target-name-text")?.textContent).toContain("Living Room Temperature"),t(e.querySelector(".history-target-entity-id")?.textContent).toContain("sensor.living_room_temperature");const a=e.querySelector(".history-target-visible-toggle input");t(a.checked).toBe(!0),t(e.querySelector(".history-target-analysis")).toBeNull(),t(e.querySelector(".history-target-analysis-toggle")).not.toBeNull()}},d={args:{analysis:E},play:async({canvasElement:n})=>{const e=(await o(n)).shadowRoot;t(e.querySelector(".history-target-analysis")).not.toBeNull(),t(e.querySelector(".history-target-row")?.classList.contains("analysis-open")).toBe(!0),t(e.querySelector(".history-target-analysis-toggle")?.classList.contains("is-open")).toBe(!0);const a=e.querySelector("analysis-trend-group");t(a).not.toBeNull(),t(a.analysis.show_trend_lines).toBe(!0);const i=a.shadowRoot?.querySelector("analysis-group");t(i).not.toBeNull()}},c={args:{color:"#ff9800",visible:!1,index:1,stateObj:{entity_id:"sensor.outdoor_humidity",state:"72",attributes:{friendly_name:"Outdoor Humidity",unit_of_measurement:"%",icon:"mdi:water-percent"},last_changed:"",last_updated:"",context:null}},play:async({canvasElement:n})=>{const e=(await o(n)).shadowRoot;t(e.querySelector(".history-target-row")?.classList.contains("is-hidden")).toBe(!0);const a=e.querySelector(".history-target-visible-toggle input");t(a.checked).toBe(!1)}},u={args:{color:"#f44336",index:2,stateObj:{entity_id:"sensor.boiler_temperature",state:"75",attributes:{friendly_name:"Boiler Temperature",unit_of_measurement:"°C",icon:"mdi:fire"},last_changed:"",last_updated:"",context:null},analysis:{...r,expanded:!0,show_threshold_analysis:!0,show_threshold_shading:!0,threshold_value:"80",threshold_direction:"above"}},play:async({canvasElement:n})=>{const a=(await o(n)).shadowRoot.querySelector("analysis-threshold-group");t(a).not.toBeNull(),t(a.analysis.show_threshold_analysis).toBe(!0),t(a.analysis.threshold_value).toBe("80"),t(a.analysis.threshold_direction).toBe("above")}},y={args:{color:"#4caf50",index:3,canShowDeltaAnalysis:!0,stateObj:{entity_id:"sensor.energy_consumption",state:"12.4",attributes:{friendly_name:"Energy Consumption",unit_of_measurement:"kWh",icon:"mdi:lightning-bolt"},last_changed:"",last_updated:"",context:null},comparisonWindows:[{id:"win-1",label:"Last week"},{id:"win-2",label:"Same day last year"}],analysis:{...r,expanded:!0,show_delta_analysis:!0,show_delta_tooltip:!0,show_delta_lines:!1}},play:async({canvasElement:n})=>{const a=(await o(n)).shadowRoot.querySelector("analysis-delta-group");t(a).not.toBeNull(),t(a.analysis.show_delta_analysis).toBe(!0),t(a.analysis.show_delta_tooltip).toBe(!0),t(a.canShowDeltaAnalysis).toBe(!0)}},p={args:{color:"#9c27b0",index:4,stateObj:{entity_id:"binary_sensor.motion_hallway",state:"on",attributes:{friendly_name:"Hallway Motion",icon:"mdi:motion-sensor"},last_changed:"",last_updated:"",context:null}},play:async({canvasElement:n})=>{const e=(await o(n)).shadowRoot;t(e.querySelector(".history-target-analysis-toggle")).toBeNull(),t(e.querySelector(".history-target-visible-toggle")).not.toBeNull(),t(e.querySelector(".history-target-remove")).not.toBeNull()}},m={render:()=>f`
    <div style="max-width: 600px; display: grid; gap: 10px;">
      <target-row
        .stateObj=${{entity_id:"sensor.living_room_temperature",state:"21.5",attributes:{friendly_name:"Living Room Temperature",unit_of_measurement:"°C",icon:"mdi:thermometer"},last_changed:"",last_updated:"",context:null}}
        .color=${"#03a9f4"}
        .visible=${!0}
        .analysis=${r}
        .index=${0}
      ></target-row>
      <target-row
        .stateObj=${{entity_id:"sensor.outdoor_humidity",state:"72",attributes:{friendly_name:"Outdoor Humidity",unit_of_measurement:"%",icon:"mdi:water-percent"},last_changed:"",last_updated:"",context:null}}
        .color=${"#ff9800"}
        .visible=${!1}
        .analysis=${r}
        .index=${1}
      ></target-row>
      <target-row
        .stateObj=${{entity_id:"sensor.energy_consumption",state:"12.4",attributes:{friendly_name:"Energy Consumption",unit_of_measurement:"kWh",icon:"mdi:lightning-bolt"},last_changed:"",last_updated:"",context:null}}
        .color=${"#4caf50"}
        .visible=${!0}
        .analysis=${E}
        .index=${2}
      ></target-row>
    </div>
  `,play:async({canvasElement:n})=>{const s=n.querySelectorAll("target-row");t(s.length).toBe(3);const e=s[1];await e.updateComplete,t(e.shadowRoot.querySelector(".history-target-row")?.classList.contains("is-hidden")).toBe(!0);const a=s[2];await a.updateComplete,t(a.shadowRoot.querySelector(".history-target-analysis")).not.toBeNull()}},h={args:{index:2,stateObj:{entity_id:"sensor.temp",state:"21.5",attributes:{friendly_name:"Temperature",unit_of_measurement:"°C"},last_changed:"",last_updated:"",context:null}},play:async({canvasElement:n})=>{const s=await o(n),e=v();s.addEventListener("dp-row-remove",e),await b.click(s.shadowRoot.querySelector(".history-target-remove")),t(e).toHaveBeenCalledOnce(),t(e.mock.calls[0][0].detail.index).toBe(2)}},g={args:{stateObj:{entity_id:"sensor.energy",state:"10.2",attributes:{friendly_name:"Energy",icon:"mdi:lightning-bolt"},last_changed:"",last_updated:"",context:null}},play:async({canvasElement:n})=>{const s=await o(n),e=v();s.addEventListener("dp-row-toggle-analysis",e),await b.click(s.shadowRoot.querySelector(".history-target-analysis-toggle")),t(e).toHaveBeenCalledOnce(),t(e.mock.calls[0][0].detail.entityId).toBe("sensor.energy")}},_={args:{stateObj:{entity_id:"sensor.humidity",state:"55",attributes:{friendly_name:"Humidity",icon:"mdi:water-percent"},last_changed:"",last_updated:"",context:null}},play:async({canvasElement:n})=>{const s=await o(n),e=v();s.addEventListener("dp-row-visibility-change",e),await b.click(s.shadowRoot.querySelector(".history-target-visible-toggle")),t(e).toHaveBeenCalledOnce();const a=e.mock.calls[0][0].detail;t(a.entityId).toBe("sensor.humidity"),t(a.visible).toBe(!1)}},w={args:{stateObj:{entity_id:"sensor.temp",state:"21.5",attributes:{friendly_name:"Temperature",unit_of_measurement:"°C"},last_changed:"",last_updated:"",context:null},analysis:{...r,expanded:!0}},play:async({canvasElement:n})=>{const s=await o(n),e=v();s.addEventListener("dp-row-analysis-change",e),s.shadowRoot.querySelector("analysis-trend-group").dispatchEvent(new CustomEvent("dp-group-analysis-change",{detail:{entityId:"sensor.temp",key:"show_trend_lines",value:!0},bubbles:!0,composed:!0})),t(e).toHaveBeenCalledOnce();const i=e.mock.calls[0][0].detail;t(i.entityId).toBe("sensor.temp"),t(i.key).toBe("show_trend_lines"),t(i.value).toBe(!0)}};l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  play: async ({
    canvasElement
  }: {
    canvasElement: HTMLElement;
  }) => {
    const el = await getEl(canvasElement);
    const sr = el.shadowRoot;
    expect(sr.querySelector(".history-target-name-text")?.textContent).toContain("Living Room Temperature");
    expect(sr.querySelector(".history-target-entity-id")?.textContent).toContain("sensor.living_room_temperature");
    const toggle = sr.querySelector(".history-target-visible-toggle input") as HTMLInputElement;
    expect(toggle.checked).toBe(true);
    expect(sr.querySelector(".history-target-analysis")).toBeNull();
    expect(sr.querySelector(".history-target-analysis-toggle")).not.toBeNull();
  }
}`,...l.parameters?.docs?.source},description:{story:`Default collapsed row — entity name, color swatch, visibility toggle, remove and
analysis buttons all visible. Analysis panel is hidden.`,...l.parameters?.docs?.description}}};d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  args: {
    analysis: EXPANDED_ANALYSIS
  },
  play: async ({
    canvasElement
  }: {
    canvasElement: HTMLElement;
  }) => {
    const el = await getEl(canvasElement);
    const sr = el.shadowRoot;
    expect(sr.querySelector(".history-target-analysis")).not.toBeNull();
    expect(sr.querySelector(".history-target-row")?.classList.contains("analysis-open")).toBe(true);
    expect(sr.querySelector(".history-target-analysis-toggle")?.classList.contains("is-open")).toBe(true);

    // Trend group is now a child component — verify it is present and checked
    const trendGroup = sr.querySelector("analysis-trend-group") as HTMLElement & {
      analysis: {
        show_trend_lines: boolean;
      };
    };
    expect(trendGroup).not.toBeNull();
    expect(trendGroup.analysis.show_trend_lines).toBe(true);

    // The group body lives inside analysis-group's shadow DOM — verify via the trend group's group wrapper
    const trendGroupInner = trendGroup.shadowRoot?.querySelector("analysis-group");
    expect(trendGroupInner).not.toBeNull();
  }
}`,...d.parameters?.docs?.source},description:{story:`Row with the full analysis panel expanded — shows all option groups including
trend lines with sub-options, summary stats, anomalies, and delta.`,...d.parameters?.docs?.description}}};c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  args: {
    color: "#ff9800",
    visible: false,
    index: 1,
    stateObj: {
      entity_id: "sensor.outdoor_humidity",
      state: "72",
      attributes: {
        friendly_name: "Outdoor Humidity",
        unit_of_measurement: "%",
        icon: "mdi:water-percent"
      },
      last_changed: "",
      last_updated: "",
      context: null
    } as unknown as HassEntityState
  },
  play: async ({
    canvasElement
  }: {
    canvasElement: HTMLElement;
  }) => {
    const el = await getEl(canvasElement);
    const sr = el.shadowRoot;
    expect(sr.querySelector(".history-target-row")?.classList.contains("is-hidden")).toBe(true);
    const toggle = sr.querySelector(".history-target-visible-toggle input") as HTMLInputElement;
    expect(toggle.checked).toBe(false);
  }
}`,...c.parameters?.docs?.source},description:{story:"Hidden row — reduced opacity via `is-hidden` class, visibility toggle unchecked.",...c.parameters?.docs?.description}}};u.parameters={...u.parameters,docs:{...u.parameters?.docs,source:{originalSource:`{
  args: {
    color: "#f44336",
    index: 2,
    stateObj: {
      entity_id: "sensor.boiler_temperature",
      state: "75",
      attributes: {
        friendly_name: "Boiler Temperature",
        unit_of_measurement: "°C",
        icon: "mdi:fire"
      },
      last_changed: "",
      last_updated: "",
      context: null
    } as unknown as HassEntityState,
    analysis: {
      ...BLANK_ANALYSIS,
      expanded: true,
      show_threshold_analysis: true,
      show_threshold_shading: true,
      threshold_value: "80",
      threshold_direction: "above"
    }
  },
  play: async ({
    canvasElement
  }: {
    canvasElement: HTMLElement;
  }) => {
    const el = await getEl(canvasElement);
    const sr = el.shadowRoot;

    // Threshold group is now a child component — verify it is present and has the correct analysis values
    const thresholdGroup = sr.querySelector("analysis-threshold-group") as HTMLElement & {
      analysis: {
        show_threshold_analysis: boolean;
        threshold_value: string;
        threshold_direction: string;
      };
    };
    expect(thresholdGroup).not.toBeNull();
    expect(thresholdGroup.analysis.show_threshold_analysis).toBe(true);
    expect(thresholdGroup.analysis.threshold_value).toBe("80");
    expect(thresholdGroup.analysis.threshold_direction).toBe("above");
  }
}`,...u.parameters?.docs?.source},description:{story:"Threshold analysis group expanded with a configured value and shading direction.",...u.parameters?.docs?.description}}};y.parameters={...y.parameters,docs:{...y.parameters?.docs,source:{originalSource:`{
  args: {
    color: "#4caf50",
    index: 3,
    canShowDeltaAnalysis: true,
    stateObj: {
      entity_id: "sensor.energy_consumption",
      state: "12.4",
      attributes: {
        friendly_name: "Energy Consumption",
        unit_of_measurement: "kWh",
        icon: "mdi:lightning-bolt"
      },
      last_changed: "",
      last_updated: "",
      context: null
    } as unknown as HassEntityState,
    comparisonWindows: [{
      id: "win-1",
      label: "Last week"
    }, {
      id: "win-2",
      label: "Same day last year"
    }] as ComparisonWindow[],
    analysis: {
      ...BLANK_ANALYSIS,
      expanded: true,
      show_delta_analysis: true,
      show_delta_tooltip: true,
      show_delta_lines: false
    }
  },
  play: async ({
    canvasElement
  }: {
    canvasElement: HTMLElement;
  }) => {
    const el = await getEl(canvasElement);
    const sr = el.shadowRoot;

    // Delta group is now a child component — verify it is present and has the correct analysis values
    const deltaGroup = sr.querySelector("analysis-delta-group") as HTMLElement & {
      analysis: {
        show_delta_analysis: boolean;
        show_delta_tooltip: boolean;
      };
      canShowDeltaAnalysis: boolean;
    };
    expect(deltaGroup).not.toBeNull();
    expect(deltaGroup.analysis.show_delta_analysis).toBe(true);
    expect(deltaGroup.analysis.show_delta_tooltip).toBe(true);
    expect(deltaGroup.canShowDeltaAnalysis).toBe(true);
  }
}`,...y.parameters?.docs?.source},description:{story:"Delta analysis enabled with comparison windows listed in a select.",...y.parameters?.docs?.description}}};p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  args: {
    color: "#9c27b0",
    index: 4,
    stateObj: {
      entity_id: "binary_sensor.motion_hallway",
      state: "on",
      attributes: {
        friendly_name: "Hallway Motion",
        icon: "mdi:motion-sensor"
      },
      last_changed: "",
      last_updated: "",
      context: null
    } as unknown as HassEntityState
  },
  play: async ({
    canvasElement
  }: {
    canvasElement: HTMLElement;
  }) => {
    const el = await getEl(canvasElement);
    const sr = el.shadowRoot;
    expect(sr.querySelector(".history-target-analysis-toggle")).toBeNull();
    expect(sr.querySelector(".history-target-visible-toggle")).not.toBeNull();
    expect(sr.querySelector(".history-target-remove")).not.toBeNull();
  }
}`,...p.parameters?.docs?.source},description:{story:"Binary sensor — analysis is NOT supported, so the expand button is hidden.",...p.parameters?.docs?.description}}};m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
  render: () => html\`
    <div style="max-width: 600px; display: grid; gap: 10px;">
      <target-row
        .stateObj=\${{
    entity_id: "sensor.living_room_temperature",
    state: "21.5",
    attributes: {
      friendly_name: "Living Room Temperature",
      unit_of_measurement: "°C",
      icon: "mdi:thermometer"
    },
    last_changed: "",
    last_updated: "",
    context: null
  }}
        .color=\${"#03a9f4"}
        .visible=\${true}
        .analysis=\${BLANK_ANALYSIS}
        .index=\${0}
      ></target-row>
      <target-row
        .stateObj=\${{
    entity_id: "sensor.outdoor_humidity",
    state: "72",
    attributes: {
      friendly_name: "Outdoor Humidity",
      unit_of_measurement: "%",
      icon: "mdi:water-percent"
    },
    last_changed: "",
    last_updated: "",
    context: null
  }}
        .color=\${"#ff9800"}
        .visible=\${false}
        .analysis=\${BLANK_ANALYSIS}
        .index=\${1}
      ></target-row>
      <target-row
        .stateObj=\${{
    entity_id: "sensor.energy_consumption",
    state: "12.4",
    attributes: {
      friendly_name: "Energy Consumption",
      unit_of_measurement: "kWh",
      icon: "mdi:lightning-bolt"
    },
    last_changed: "",
    last_updated: "",
    context: null
  }}
        .color=\${"#4caf50"}
        .visible=\${true}
        .analysis=\${EXPANDED_ANALYSIS}
        .index=\${2}
      ></target-row>
    </div>
  \`,
  play: async ({
    canvasElement
  }: {
    canvasElement: HTMLElement;
  }) => {
    const rows = canvasElement.querySelectorAll("target-row");
    expect(rows.length).toBe(3);
    const hiddenEl = rows[1] as DpTargetRowEl;
    await hiddenEl.updateComplete;
    expect(hiddenEl.shadowRoot.querySelector(".history-target-row")?.classList.contains("is-hidden")).toBe(true);
    const expandedEl = rows[2] as DpTargetRowEl;
    await expandedEl.updateComplete;
    expect(expandedEl.shadowRoot.querySelector(".history-target-analysis")).not.toBeNull();
  }
}`,...m.parameters?.docs?.source},description:{story:`Three rows stacked — demonstrates spacing, mixed visibility, and one expanded row.
Uses a custom render since multiple independent elements are needed.`,...m.parameters?.docs?.description}}};h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`{
  args: {
    index: 2,
    stateObj: {
      entity_id: "sensor.temp",
      state: "21.5",
      attributes: {
        friendly_name: "Temperature",
        unit_of_measurement: "°C"
      },
      last_changed: "",
      last_updated: "",
      context: null
    } as unknown as HassEntityState
  },
  play: async ({
    canvasElement
  }: {
    canvasElement: HTMLElement;
  }) => {
    const el = await getEl(canvasElement);
    const spy = fn();
    el.addEventListener("dp-row-remove", spy);
    await userEvent.click(el.shadowRoot.querySelector(".history-target-remove") as HTMLButtonElement);
    expect(spy).toHaveBeenCalledOnce();
    expect((spy.mock.calls[0][0] as CustomEvent).detail.index).toBe(2);
  }
}`,...h.parameters?.docs?.source},description:{story:"Clicking × fires `dp-row-remove` with the row's index.",...h.parameters?.docs?.description}}};g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
  args: {
    stateObj: {
      entity_id: "sensor.energy",
      state: "10.2",
      attributes: {
        friendly_name: "Energy",
        icon: "mdi:lightning-bolt"
      },
      last_changed: "",
      last_updated: "",
      context: null
    } as unknown as HassEntityState
  },
  play: async ({
    canvasElement
  }: {
    canvasElement: HTMLElement;
  }) => {
    const el = await getEl(canvasElement);
    const spy = fn();
    el.addEventListener("dp-row-toggle-analysis", spy);
    await userEvent.click(el.shadowRoot.querySelector(".history-target-analysis-toggle") as HTMLButtonElement);
    expect(spy).toHaveBeenCalledOnce();
    expect((spy.mock.calls[0][0] as CustomEvent).detail.entityId).toBe("sensor.energy");
  }
}`,...g.parameters?.docs?.source},description:{story:"Clicking the chevron fires `dp-row-toggle-analysis` with the entity ID.",...g.parameters?.docs?.description}}};_.parameters={..._.parameters,docs:{..._.parameters?.docs,source:{originalSource:`{
  args: {
    stateObj: {
      entity_id: "sensor.humidity",
      state: "55",
      attributes: {
        friendly_name: "Humidity",
        icon: "mdi:water-percent"
      },
      last_changed: "",
      last_updated: "",
      context: null
    } as unknown as HassEntityState
  },
  play: async ({
    canvasElement
  }: {
    canvasElement: HTMLElement;
  }) => {
    const el = await getEl(canvasElement);
    const spy = fn();
    el.addEventListener("dp-row-visibility-change", spy);
    await userEvent.click(el.shadowRoot.querySelector(".history-target-visible-toggle") as HTMLLabelElement);
    expect(spy).toHaveBeenCalledOnce();
    const detail = (spy.mock.calls[0][0] as CustomEvent).detail;
    expect(detail.entityId).toBe("sensor.humidity");
    expect(detail.visible).toBe(false);
  }
}`,..._.parameters?.docs?.source},description:{story:"Toggling the visibility switch fires `dp-row-visibility-change`.",..._.parameters?.docs?.description}}};w.parameters={...w.parameters,docs:{...w.parameters?.docs,source:{originalSource:`{
  args: {
    stateObj: {
      entity_id: "sensor.temp",
      state: "21.5",
      attributes: {
        friendly_name: "Temperature",
        unit_of_measurement: "°C"
      },
      last_changed: "",
      last_updated: "",
      context: null
    } as unknown as HassEntityState,
    analysis: {
      ...BLANK_ANALYSIS,
      expanded: true
    }
  },
  play: async ({
    canvasElement
  }: {
    canvasElement: HTMLElement;
  }) => {
    const el = await getEl(canvasElement);
    const spy = fn();
    el.addEventListener("dp-row-analysis-change", spy);

    // Trend group is now a child component — fire dp-group-analysis-change on it to simulate a change
    const trendGroup = el.shadowRoot.querySelector("analysis-trend-group") as HTMLElement;
    trendGroup.dispatchEvent(new CustomEvent("dp-group-analysis-change", {
      detail: {
        entityId: "sensor.temp",
        key: "show_trend_lines",
        value: true
      },
      bubbles: true,
      composed: true
    }));
    expect(spy).toHaveBeenCalledOnce();
    const detail = (spy.mock.calls[0][0] as CustomEvent).detail;
    expect(detail.entityId).toBe("sensor.temp");
    expect(detail.key).toBe("show_trend_lines");
    expect(detail.value).toBe(true);
  }
}`,...w.parameters?.docs?.source},description:{story:"Changing an analysis checkbox fires `dp-row-analysis-change` with the correct key.",...w.parameters?.docs?.description}}};const W=["Default","AnalysisExpanded","Hidden","WithThresholdAnalysis","WithDeltaAnalysis","BinarySensor","MultipleRows","EmitsRemove","EmitsToggleAnalysis","EmitsVisibilityChange","EmitsAnalysisChange"];export{d as AnalysisExpanded,p as BinarySensor,l as Default,w as EmitsAnalysisChange,h as EmitsRemove,g as EmitsToggleAnalysis,_ as EmitsVisibilityChange,c as Hidden,m as MultipleRows,y as WithDeltaAnalysis,u as WithThresholdAnalysis,W as __namedExportsOrder,G as default};

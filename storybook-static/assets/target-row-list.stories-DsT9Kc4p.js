import{b as R}from"./iframe-maWesKjk.js";import{e as n,f as h,u as b}from"./index-BVN6m9Ti.js";import"./target-row-list-BFfSKevV.js";import"./preload-helper-PPVm8Dsz.js";import"./property-DyW-YDBW.js";import"./localize-Cz1ya3ms.js";import"./target-row-CqKWU3NH.js";import"./analysis-sample-group-B6DXKU1N.js";import"./analysis-group-shared.styles-Cw1nMqQy.js";import"./analysis-group-ZyfAZWsO.js";import"./localized-decorator-CXjGGqe_.js";import"./analysis-trend-group-C_jadOVq.js";import"./analysis-summary-group-18mMfsol.js";import"./analysis-rate-group-ClWjzN4_.js";import"./analysis-threshold-group-CvkzLvvQ.js";import"./analysis-anomaly-group-COJBbfcf.js";import"./analysis-method-subopts-INTT52YI.js";import"./analysis-delta-group-COrtQ8Ee.js";const l={expanded:!1,show_trend_lines:!1,trend_method:"rolling_average",trend_window:"24h",show_trend_crosshairs:!1,show_summary_stats:!1,show_summary_stats_shading:!1,show_rate_of_change:!1,show_rate_crosshairs:!1,rate_window:"1h",show_threshold_analysis:!1,show_threshold_shading:!1,threshold_value:"",threshold_direction:"above",show_anomalies:!1,anomaly_methods:[],anomaly_overlap_mode:"all",anomaly_sensitivity:"medium",anomaly_rate_window:"1h",anomaly_zscore_window:"24h",anomaly_persistence_window:"1h",anomaly_comparison_window_id:null,show_delta_analysis:!1,show_delta_tooltip:!0,show_delta_lines:!1,hide_source_series:!1,sample_interval:"raw",sample_aggregate:"mean",anomaly_use_sampled_data:!1},r=[{entity_id:"sensor.living_room_temperature",color:"#03a9f4",visible:!0,analysis:l},{entity_id:"sensor.bedroom_temperature",color:"#e040fb",visible:!1,analysis:l},{entity_id:"sensor.outdoor_temperature",color:"#69f0ae",visible:!0,analysis:{...l,show_trend_lines:!0}}],E={"sensor.living_room_temperature":{entity_id:"sensor.living_room_temperature",state:"21.5",attributes:{friendly_name:"Living Room",unit_of_measurement:"°C",icon:"mdi:thermometer",device_class:"temperature"},last_changed:"2024-01-01T00:00:00.000Z",last_updated:"2024-01-01T00:00:00.000Z",context:{id:"abc1",parent_id:null,user_id:null}},"sensor.bedroom_temperature":{entity_id:"sensor.bedroom_temperature",state:"19.2",attributes:{friendly_name:"Bedroom",unit_of_measurement:"°C",icon:"mdi:thermometer",device_class:"temperature"},last_changed:"2024-01-01T00:00:00.000Z",last_updated:"2024-01-01T00:00:00.000Z",context:{id:"abc2",parent_id:null,user_id:null}},"sensor.outdoor_temperature":{entity_id:"sensor.outdoor_temperature",state:"8.0",attributes:{friendly_name:"Outdoor",unit_of_measurement:"°C",icon:"mdi:thermometer-auto",device_class:"temperature"},last_changed:"2024-01-01T00:00:00.000Z",last_updated:"2024-01-01T00:00:00.000Z",context:{id:"abc3",parent_id:null,user_id:null}}};async function a(t){const o=t.querySelector("target-row-list");return await o.updateComplete,o}const j={title:"Molecules/Target Row List",component:"target-row-list",parameters:{actions:{handles:["dp-rows-reorder","dp-row-color-change","dp-row-visibility-change","dp-row-toggle-analysis","dp-row-remove","dp-row-analysis-change"]},docs:{description:{component:"`target-row-list` renders an ordered list of `target-row` elements\nwith HTML5 drag-to-reorder support. Pass `rows` and `states` to populate the\nlist. An empty `rows` array shows an empty-state message. Expansion of the\nanalysis panel is driven by `analysis.expanded` inside each row's analysis object.\n\n@fires dp-rows-reorder - `{ rows: RowConfig[] }` Emitted after a drag-drop reorder.\n@fires dp-row-color-change - Bubbled from child row. `{ index, color }`\n@fires dp-row-visibility-change - Bubbled from child row. `{ entityId, visible }`\n@fires dp-row-toggle-analysis - Bubbled from child row. `{ entityId }`\n@fires dp-row-remove - Bubbled from child row. `{ index }`\n@fires dp-row-analysis-change - Bubbled from child row. `{ entityId, key, value }`"}}},argTypes:{rows:{control:"object",description:"Array of RowConfig objects, each with `entity_id`, `color`, `visible`, and `analysis` fields. Set `analysis.expanded = true` on a row to have its analysis panel open."},states:{control:"object",description:"Map of entity_id → HA entity state object. Passed to `ha-state-icon` inside each colour swatch."},canShowDeltaAnalysis:{control:"boolean",description:"Whether at least one comparison window exists, enabling the delta analysis option."},comparisonWindows:{control:"object",description:"Array of date-window comparison objects available for delta analysis."}},args:{rows:r,states:E,canShowDeltaAnalysis:!1,comparisonWindows:[]},render:t=>R`
    <div style="max-width: 640px;">
      <target-row-list
        .rows=${t.rows}
        .states=${t.states}
        .canShowDeltaAnalysis=${t.canShowDeltaAnalysis}
        .comparisonWindows=${t.comparisonWindows}
      ></target-row-list>
    </div>
  `},c={play:async({canvasElement:t})=>{const e=(await a(t)).shadowRoot.querySelectorAll("target-row");n(e).toHaveLength(3)}},d={args:{rows:[]},play:async({canvasElement:t})=>{const o=await a(t),e=o.shadowRoot.querySelector(".history-target-empty");n(e).not.toBeNull();const s=o.shadowRoot.querySelectorAll("target-row");n(s).toHaveLength(0)}},m={args:{rows:[{...r[0],analysis:{...l,expanded:!0}},r[1],r[2]]},play:async({canvasElement:t})=>{const e=(await a(t)).shadowRoot.querySelector("target-row");await e.updateComplete;const s=e.shadowRoot.querySelector(".history-target-analysis-toggle");n(s?.classList.contains("is-open")).toBe(!0)}},p={args:{rows:[r[0]],states:{"sensor.living_room_temperature":E["sensor.living_room_temperature"]}},play:async({canvasElement:t})=>{const e=(await a(t)).shadowRoot.querySelectorAll("target-row");n(e).toHaveLength(1)}},w={args:{rows:[...r,{entity_id:"sensor.kitchen_temperature",color:"#ff7043",visible:!0,analysis:l},{entity_id:"sensor.garage_temperature",color:"#ffd740",visible:!0,analysis:l}],states:{...E,"sensor.kitchen_temperature":{entity_id:"sensor.kitchen_temperature",state:"22.1",attributes:{friendly_name:"Kitchen",unit_of_measurement:"°C",icon:"mdi:thermometer",device_class:"temperature"},last_changed:"2024-01-01T00:00:00.000Z",last_updated:"2024-01-01T00:00:00.000Z",context:{id:"abc4",parent_id:null,user_id:null}},"sensor.garage_temperature":{entity_id:"sensor.garage_temperature",state:"5.3",attributes:{friendly_name:"Garage",unit_of_measurement:"°C",icon:"mdi:thermometer",device_class:"temperature"},last_changed:"2024-01-01T00:00:00.000Z",last_updated:"2024-01-01T00:00:00.000Z",context:{id:"abc5",parent_id:null,user_id:null}}}},play:async({canvasElement:t})=>{const e=(await a(t)).shadowRoot.querySelectorAll("target-row");n(e).toHaveLength(5)}},y={args:{rows:[r[0],r[1]]},play:async({canvasElement:t})=>{const o=await a(t),e=h();o.addEventListener("dp-row-remove",e);const v=o.shadowRoot.querySelectorAll("target-row")[1].shadowRoot.querySelector(".history-target-remove");await b.click(v),n(e).toHaveBeenCalledOnce(),n(e.mock.calls[0][0].detail.index).toBe(1)}},u={play:async({canvasElement:t})=>{const o=await a(t),e=h();o.addEventListener("dp-row-toggle-analysis",e);const i=o.shadowRoot.querySelector("target-row").shadowRoot.querySelector(".history-target-analysis-toggle");await b.click(i),n(e).toHaveBeenCalledOnce(),n(e.mock.calls[0][0].detail.entityId).toBe("sensor.living_room_temperature")}},g={play:async({canvasElement:t})=>{const o=await a(t),e=h();o.addEventListener("dp-row-visibility-change",e);const i=o.shadowRoot.querySelector("target-row").shadowRoot.querySelector(".history-target-visible-toggle input");i.checked=!1,i.dispatchEvent(new Event("change")),n(e).toHaveBeenCalledOnce(),n(e.mock.calls[0][0].detail.entityId).toBe("sensor.living_room_temperature"),n(e.mock.calls[0][0].detail.visible).toBe(!1)}},_={play:async({canvasElement:t})=>{const o=await a(t),e=h();o.addEventListener("dp-rows-reorder",e);const s=o.shadowRoot.querySelectorAll("target-row");s[0].dispatchEvent(new DragEvent("dragstart",{dataTransfer:new DataTransfer,bubbles:!0,cancelable:!0}));const i=s[1].getBoundingClientRect(),v=new DragEvent("drop",{dataTransfer:new DataTransfer,bubbles:!0,cancelable:!0,clientY:i.bottom+1});s[1].dispatchEvent(v),n(e).toHaveBeenCalledOnce();const f=e.mock.calls[0][0].detail.rows;n(f[0].entity_id).toBe("sensor.bedroom_temperature"),n(f[1].entity_id).toBe("sensor.living_room_temperature")}};c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  play: async ({
    canvasElement
  }: {
    canvasElement: HTMLElement;
  }) => {
    const el = await getEl(canvasElement);
    const rows = el.shadowRoot.querySelectorAll("target-row");
    expect(rows).toHaveLength(3);
  }
}`,...c.parameters?.docs?.source},description:{story:"Three rows: one hidden, one with trend analysis, all with different colors.",...c.parameters?.docs?.description}}};d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  args: {
    rows: []
  },
  play: async ({
    canvasElement
  }: {
    canvasElement: HTMLElement;
  }) => {
    const el = await getEl(canvasElement);
    const emptyEl = el.shadowRoot.querySelector(".history-target-empty");
    expect(emptyEl).not.toBeNull();
    const rows = el.shadowRoot.querySelectorAll("target-row");
    expect(rows).toHaveLength(0);
  }
}`,...d.parameters?.docs?.source},description:{story:"No rows — displays the empty state message.",...d.parameters?.docs?.description}}};m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
  args: {
    rows: [{
      ...SAMPLE_ROWS[0],
      analysis: {
        ...BLANK_ANALYSIS,
        expanded: true
      }
    }, SAMPLE_ROWS[1], SAMPLE_ROWS[2]]
  },
  play: async ({
    canvasElement
  }: {
    canvasElement: HTMLElement;
  }) => {
    const el = await getEl(canvasElement);
    const firstRow = el.shadowRoot.querySelector("target-row") as HTMLElement & {
      updateComplete: Promise<boolean>;
    };
    await firstRow.updateComplete;
    // The first row should have analysis.expanded = true — verify the toggle has is-open class
    const toggleBtn = firstRow.shadowRoot!.querySelector(".history-target-analysis-toggle");
    expect(toggleBtn?.classList.contains("is-open")).toBe(true);
  }
}`,...m.parameters?.docs?.source},description:{story:"Analysis panel expanded for the first entity via analysis.expanded.",...m.parameters?.docs?.description}}};p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  args: {
    rows: [SAMPLE_ROWS[0]],
    states: {
      "sensor.living_room_temperature": SAMPLE_STATES["sensor.living_room_temperature"]
    }
  },
  play: async ({
    canvasElement
  }: {
    canvasElement: HTMLElement;
  }) => {
    const el = await getEl(canvasElement);
    const rows = el.shadowRoot.querySelectorAll("target-row");
    expect(rows).toHaveLength(1);
  }
}`,...p.parameters?.docs?.source},description:{story:"Single row — simplest possible list.",...p.parameters?.docs?.description}}};w.parameters={...w.parameters,docs:{...w.parameters?.docs,source:{originalSource:`{
  args: {
    rows: [...SAMPLE_ROWS, {
      entity_id: "sensor.kitchen_temperature",
      color: "#ff7043",
      visible: true,
      analysis: BLANK_ANALYSIS
    }, {
      entity_id: "sensor.garage_temperature",
      color: "#ffd740",
      visible: true,
      analysis: BLANK_ANALYSIS
    }],
    states: {
      ...SAMPLE_STATES,
      "sensor.kitchen_temperature": {
        entity_id: "sensor.kitchen_temperature",
        state: "22.1",
        attributes: {
          friendly_name: "Kitchen",
          unit_of_measurement: "°C",
          icon: "mdi:thermometer",
          device_class: "temperature"
        },
        last_changed: "2024-01-01T00:00:00.000Z",
        last_updated: "2024-01-01T00:00:00.000Z",
        context: {
          id: "abc4",
          parent_id: null,
          user_id: null
        }
      },
      "sensor.garage_temperature": {
        entity_id: "sensor.garage_temperature",
        state: "5.3",
        attributes: {
          friendly_name: "Garage",
          unit_of_measurement: "°C",
          icon: "mdi:thermometer",
          device_class: "temperature"
        },
        last_changed: "2024-01-01T00:00:00.000Z",
        last_updated: "2024-01-01T00:00:00.000Z",
        context: {
          id: "abc5",
          parent_id: null,
          user_id: null
        }
      }
    }
  },
  play: async ({
    canvasElement
  }: {
    canvasElement: HTMLElement;
  }) => {
    const el = await getEl(canvasElement);
    const rows = el.shadowRoot.querySelectorAll("target-row");
    expect(rows).toHaveLength(5);
  }
}`,...w.parameters?.docs?.source},description:{story:"Many rows to verify layout at scale.",...w.parameters?.docs?.description}}};y.parameters={...y.parameters,docs:{...y.parameters?.docs,source:{originalSource:`{
  args: {
    rows: [SAMPLE_ROWS[0], SAMPLE_ROWS[1]]
  },
  play: async ({
    canvasElement
  }: {
    canvasElement: HTMLElement;
  }) => {
    const el = await getEl(canvasElement);
    const spy = fn();
    el.addEventListener("dp-row-remove", spy);

    // Click remove on the second row (index 1)
    const rows = el.shadowRoot.querySelectorAll("target-row") as NodeListOf<HTMLElement & {
      shadowRoot: ShadowRoot;
    }>;
    const secondRow = rows[1];
    const removeBtn = secondRow.shadowRoot.querySelector(".history-target-remove") as HTMLButtonElement;
    await userEvent.click(removeBtn);
    expect(spy).toHaveBeenCalledOnce();
    expect((spy.mock.calls[0][0] as CustomEvent).detail.index).toBe(1);
  }
}`,...y.parameters?.docs?.source},description:{story:"Clicking remove on a child row emits `dp-row-remove` with the correct index.",...y.parameters?.docs?.description}}};u.parameters={...u.parameters,docs:{...u.parameters?.docs,source:{originalSource:`{
  play: async ({
    canvasElement
  }: {
    canvasElement: HTMLElement;
  }) => {
    const el = await getEl(canvasElement);
    const spy = fn();
    el.addEventListener("dp-row-toggle-analysis", spy);
    const firstRow = el.shadowRoot.querySelector("target-row") as HTMLElement & {
      shadowRoot: ShadowRoot;
    };
    const toggleBtn = firstRow.shadowRoot.querySelector(".history-target-analysis-toggle") as HTMLButtonElement;
    await userEvent.click(toggleBtn);
    expect(spy).toHaveBeenCalledOnce();
    expect((spy.mock.calls[0][0] as CustomEvent).detail.entityId).toBe("sensor.living_room_temperature");
  }
}`,...u.parameters?.docs?.source},description:{story:"Clicking the analysis toggle on a child row emits `dp-row-toggle-analysis`.",...u.parameters?.docs?.description}}};g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
  play: async ({
    canvasElement
  }: {
    canvasElement: HTMLElement;
  }) => {
    const el = await getEl(canvasElement);
    const spy = fn();
    el.addEventListener("dp-row-visibility-change", spy);
    const firstRow = el.shadowRoot.querySelector("target-row") as HTMLElement & {
      shadowRoot: ShadowRoot;
    };
    const checkbox = firstRow.shadowRoot.querySelector(".history-target-visible-toggle input") as HTMLInputElement;
    // Simulate browser toggling the checkbox before the change event fires
    checkbox.checked = false;
    checkbox.dispatchEvent(new Event("change"));
    expect(spy).toHaveBeenCalledOnce();
    expect((spy.mock.calls[0][0] as CustomEvent).detail.entityId).toBe("sensor.living_room_temperature");
    expect((spy.mock.calls[0][0] as CustomEvent).detail.visible).toBe(false);
  }
}`,...g.parameters?.docs?.source},description:{story:"Toggling visibility on a child row emits `dp-row-visibility-change`.",...g.parameters?.docs?.description}}};_.parameters={..._.parameters,docs:{..._.parameters?.docs,source:{originalSource:`{
  play: async ({
    canvasElement
  }: {
    canvasElement: HTMLElement;
  }) => {
    const el = (await getEl(canvasElement)) as ListEl & {
      rows: RowConfig[];
    };
    const spy = fn();
    el.addEventListener("dp-rows-reorder", spy);
    const rows = el.shadowRoot.querySelectorAll("target-row") as NodeListOf<HTMLElement>;

    // Trigger dragstart on row 0 → sets internal _dragSourceIndex = 0
    rows[0].dispatchEvent(new DragEvent("dragstart", {
      dataTransfer: new DataTransfer(),
      bubbles: true,
      cancelable: true
    }));

    // Dispatch drop directly on row[1] — it bubbles to the tbody @drop listener,
    // and composedPath() will include the target-row element so _rowFromEvent finds it.
    const rowRect = rows[1].getBoundingClientRect();
    const dropEvent = new DragEvent("drop", {
      dataTransfer: new DataTransfer(),
      bubbles: true,
      cancelable: true,
      // below midpoint → "after" position (row 0 drops to index 1)
      clientY: rowRect.bottom + 1
    });
    rows[1].dispatchEvent(dropEvent);
    expect(spy).toHaveBeenCalledOnce();
    const reorderedRows: RowConfig[] = (spy.mock.calls[0][0] as CustomEvent).detail.rows;
    // Row 0 moved after row 1: new order is [bedroom, living_room, outdoor]
    expect(reorderedRows[0].entity_id).toBe("sensor.bedroom_temperature");
    expect(reorderedRows[1].entity_id).toBe("sensor.living_room_temperature");
  }
}`,..._.parameters?.docs?.source},description:{story:"Reorder emits `dp-rows-reorder` with the updated rows array.",..._.parameters?.docs?.description}}};const K=["Default","Empty","WithExpandedAnalysis","SingleRow","ManyRows","EmitsRemove","EmitsToggleAnalysis","EmitsVisibilityChange","EmitsReorder"];export{c as Default,y as EmitsRemove,_ as EmitsReorder,u as EmitsToggleAnalysis,g as EmitsVisibilityChange,d as Empty,w as ManyRows,p as SingleRow,m as WithExpandedAnalysis,K as __namedExportsOrder,j as default};
